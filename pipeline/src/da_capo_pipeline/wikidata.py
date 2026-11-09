from collections import defaultdict
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any, cast
from urllib.parse import unquote, urlsplit

import httpx

from .http import get_json
from .models import Biography, OpenOpusComposer, RelationType, WikidataProfile

SPARQL_URL = "https://query.wikidata.org/sparql"
SUMMARY_URL = "https://fr.wikipedia.org/api/rest_v1/page/summary/{title}"
ENTITY_PREFIX = "http://www.wikidata.org/entity/"
BATCH_SIZE = 40

MATCH_QUERY = """
SELECT ?name ?item ?birth ?birthPlaceLabel ?deathPlaceLabel ?article WHERE {{
  VALUES ?name {{ {names} }}
  {{ ?item rdfs:label ?name }} UNION {{ ?item skos:altLabel ?name }}
  ?item wdt:P31 wd:Q5 ; wdt:P106/wdt:P279* wd:Q36834 .
  OPTIONAL {{ ?item wdt:P569 ?birth }}
  OPTIONAL {{
    ?item wdt:P19 ?birthPlace .
    ?birthPlace rdfs:label ?birthPlaceLabel .
    FILTER(LANG(?birthPlaceLabel) = "fr")
  }}
  OPTIONAL {{
    ?item wdt:P20 ?deathPlace .
    ?deathPlace rdfs:label ?deathPlaceLabel .
    FILTER(LANG(?deathPlaceLabel) = "fr")
  }}
  OPTIONAL {{ ?article schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> }}
}}
"""

RELATIONS_QUERY = """
SELECT ?a ?b ?type WHERE {{
  VALUES ?a {{ {items} }}
  VALUES ?b {{ {items} }}
  {{ ?a wdt:P1066 ?b . BIND("eleve_de" AS ?type) }}
  UNION {{ ?b wdt:P802 ?a . BIND("eleve_de" AS ?type) }}
  UNION {{ ?a wdt:P737 ?b . BIND("influence_par" AS ?type) }}
}}
"""


@dataclass
class _Candidate:
    birth_years: set[int]
    birth_place: str | None = None
    death_place: str | None = None
    article_url: str | None = None


def sparql_literal(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"@en'


def entity_id(uri: str) -> str:
    return uri.removeprefix(ENTITY_PREFIX)


def _bindings(payload: Any) -> list[Mapping[str, Mapping[str, str]]]:
    results = cast(Mapping[str, Any], payload).get("results", {})
    return cast(list[Mapping[str, Mapping[str, str]]], results.get("bindings", []))


def _value(binding: Mapping[str, Mapping[str, str]], key: str) -> str | None:
    cell = binding.get(key)
    return cell.get("value") if cell else None


def _query(client: httpx.Client, query: str) -> list[Mapping[str, Mapping[str, str]]]:
    payload = get_json(
        client,
        SPARQL_URL,
        params={"query": query, "format": "json"},
    )
    return _bindings(payload)


def parse_candidates(
    bindings: Iterable[Mapping[str, Mapping[str, str]]],
) -> dict[str, dict[str, _Candidate]]:
    candidates: dict[str, dict[str, _Candidate]] = defaultdict(dict)
    for binding in bindings:
        name = _value(binding, "name")
        item = _value(binding, "item")
        if name is None or item is None:
            continue
        candidate = candidates[name].setdefault(entity_id(item), _Candidate(birth_years=set()))
        birth = _value(binding, "birth")
        if birth and birth.lstrip("+-")[:4].isdigit():
            candidate.birth_years.add(int(birth.lstrip("+")[:4]))
        candidate.birth_place = candidate.birth_place or _value(binding, "birthPlaceLabel")
        candidate.death_place = candidate.death_place or _value(binding, "deathPlaceLabel")
        candidate.article_url = candidate.article_url or _value(binding, "article")
    return candidates


def choose_profile(
    composer: OpenOpusComposer, candidates: Mapping[str, _Candidate]
) -> WikidataProfile | None:
    expected = composer.birth_year
    matching = [
        (item, candidate)
        for item, candidate in candidates.items()
        if expected is not None and any(abs(year - expected) <= 1 for year in candidate.birth_years)
    ]
    if not matching and expected is None and len(candidates) == 1:
        matching = list(candidates.items())
    if len(matching) != 1:
        return None
    item, candidate = matching[0]
    return WikidataProfile(
        wikidata_id=item,
        birth_place=candidate.birth_place,
        death_place=candidate.death_place,
        article_url=candidate.article_url,
    )


def match_composers(
    client: httpx.Client, composers: Sequence[OpenOpusComposer]
) -> dict[int, WikidataProfile]:
    profiles: dict[int, WikidataProfile] = {}
    for start in range(0, len(composers), BATCH_SIZE):
        batch = composers[start : start + BATCH_SIZE]
        names = " ".join(sorted({sparql_literal(composer.complete_name) for composer in batch}))
        candidates = parse_candidates(_query(client, MATCH_QUERY.format(names=names)))
        for composer in batch:
            profile = choose_profile(composer, candidates.get(composer.complete_name, {}))
            if profile is not None:
                profiles[composer.id] = profile
    return profiles


def parse_relations(
    bindings: Iterable[Mapping[str, Mapping[str, str]]],
) -> set[tuple[str, str, RelationType]]:
    relations: set[tuple[str, str, RelationType]] = set()
    for binding in bindings:
        source, target, kind = _value(binding, "a"), _value(binding, "b"), _value(binding, "type")
        if source is None or target is None or kind not in ("eleve_de", "influence_par"):
            continue
        source_id, target_id = entity_id(source), entity_id(target)
        if source_id != target_id:
            relations.add((source_id, target_id, cast(RelationType, kind)))
    return relations


def fetch_relations(
    client: httpx.Client, wikidata_ids: Iterable[str]
) -> set[tuple[str, str, RelationType]]:
    items = " ".join(f"wd:{item}" for item in sorted(set(wikidata_ids)))
    if not items:
        return set()
    return parse_relations(_query(client, RELATIONS_QUERY.format(items=items)))


def article_title(article_url: str) -> str:
    path = urlsplit(article_url).path
    return path.removeprefix("/wiki/")


def fetch_biography(client: httpx.Client, article_url: str) -> Biography | None:
    url = SUMMARY_URL.format(title=article_title(article_url))
    try:
        payload = cast(Mapping[str, Any], get_json(client, url))
    except httpx.HTTPStatusError:
        return None
    extract = payload.get("extract")
    if not isinstance(extract, str) or not extract.strip():
        return None
    desktop = cast(Mapping[str, Any], payload.get("content_urls", {})).get("desktop", {})
    page = cast(Mapping[str, Any], desktop).get("page")
    return Biography(
        text=extract.strip(),
        url=page if isinstance(page, str) else unquote(article_url),
    )
