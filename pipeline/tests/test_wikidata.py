import httpx

from da_capo_pipeline.models import OpenOpusComposer
from da_capo_pipeline.wikidata import (
    article_title,
    choose_profile,
    fetch_biography,
    parse_candidates,
    parse_relations,
    sparql_literal,
)


def _binding(item: str, birth: str | None, name: str = "Josef Suk") -> dict[str, dict[str, str]]:
    binding = {
        "name": {"value": name},
        "item": {"value": f"http://www.wikidata.org/entity/{item}"},
    }
    if birth:
        binding["birth"] = {"value": birth}
    return binding


SUK = OpenOpusComposer(
    id=300, name="Suk", complete_name="Josef Suk", birth="1874-01-01", epoch="20th Century"
)


def test_sparql_literals_are_escaped() -> None:
    assert sparql_literal('Le "Grand" \\ Maître') == '"Le \\"Grand\\" \\\\ Maître"@en'


def test_homonyms_are_told_apart_by_birth_year() -> None:
    candidates = parse_candidates(
        [
            _binding("Q312813", "1874-01-04T00:00:00Z"),
            _binding("Q1702345", "1929-08-08T00:00:00Z"),
        ]
    )["Josef Suk"]
    profile = choose_profile(SUK, candidates)
    assert profile is not None
    assert profile.wikidata_id == "Q312813"


def test_ambiguous_or_unknown_matches_are_skipped() -> None:
    candidates = parse_candidates(
        [
            _binding("Q1", "1874-01-04T00:00:00Z"),
            _binding("Q2", "1875-01-04T00:00:00Z"),
        ]
    )["Josef Suk"]
    assert choose_profile(SUK, candidates) is None
    assert choose_profile(SUK, {}) is None


def test_relations_ignore_self_links_and_unknown_types() -> None:
    entity = "http://www.wikidata.org/entity/"
    relations = parse_relations(
        [
            {
                "a": {"value": f"{entity}Q1"},
                "b": {"value": f"{entity}Q2"},
                "type": {"value": "eleve_de"},
            },
            {
                "a": {"value": f"{entity}Q1"},
                "b": {"value": f"{entity}Q1"},
                "type": {"value": "eleve_de"},
            },
            {
                "a": {"value": f"{entity}Q1"},
                "b": {"value": f"{entity}Q3"},
                "type": {"value": "ami"},
            },
        ]
    )
    assert relations == {("Q1", "Q2", "eleve_de")}


def test_article_title_keeps_the_encoded_path() -> None:
    url = "https://fr.wikipedia.org/wiki/Anton%C3%ADn_Dvo%C5%99%C3%A1k"
    assert article_title(url) == "Anton%C3%ADn_Dvo%C5%99%C3%A1k"


def test_biography_falls_back_to_none_on_missing_page(client: httpx.Client) -> None:
    biography = fetch_biography(client, "https://fr.wikipedia.org/wiki/Antonín_Dvořák")
    assert biography is not None
    assert biography.text.startswith("Antonín Dvořák")
    assert fetch_biography(client, "https://fr.wikipedia.org/wiki/Johannes_Brahms") is None
