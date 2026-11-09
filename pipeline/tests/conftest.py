from typing import Any
from urllib.parse import parse_qs

import httpx
import pytest

COMPOSERS = {
    "112": {
        "id": "112",
        "name": "Dvořák",
        "complete_name": "Antonín Dvořák",
        "birth": "1841-01-01",
        "death": "1904-01-01",
        "epoch": "Romantic",
        "portrait": "https://assets.openopus.org/portraits/dvorak.jpg",
    },
    "80": {
        "id": "80",
        "name": "Brahms",
        "complete_name": "Johannes Brahms",
        "birth": "1833-01-01",
        "death": "1897-01-01",
        "epoch": "Romantic",
        "portrait": "https://assets.openopus.org/portraits/brahms.jpg",
    },
    "300": {
        "id": "300",
        "name": "Suk",
        "complete_name": "Josef Suk",
        "birth": "1874-01-01",
        "death": "1935-01-01",
        "epoch": "20th Century",
        "portrait": "https://assets.openopus.org/portraits/suk.jpg",
    },
}

WORKS = {
    "112": [
        {
            "title": "Cello Concerto in B minor, op. 104",
            "subtitle": "",
            "searchterms": "",
            "popular": "1",
            "recommended": "1",
            "id": "9001",
            "genre": "Orchestral",
        },
        {
            "title": "Rusalka, op. 114",
            "subtitle": "Opera in three acts",
            "searchterms": "",
            "popular": "1",
            "recommended": "1",
            "id": "9002",
            "genre": "Stage",
        },
    ],
    "80": [
        {
            "title": "Symphony no. 4 in E minor, op. 98",
            "subtitle": "",
            "searchterms": "",
            "popular": "1",
            "recommended": "1",
            "id": "7706",
            "genre": "Orchestral",
        }
    ],
}

WIKIDATA = {
    "Antonín Dvořák": ("Q7298", "1841-09-08T00:00:00Z", "Nelahozeves", "Prague", "Antonín_Dvořák"),
    "Johannes Brahms": ("Q7294", "1833-05-07T00:00:00Z", "Hambourg", "Vienne", "Johannes_Brahms"),
}


def _status(rows: int) -> dict[str, Any]:
    if rows == 0:
        return {"success": "false", "error": "No composers found"}
    return {"success": "true", "rows": rows}


def _composer_list(ids: list[str]) -> dict[str, Any]:
    composers = [COMPOSERS[item] for item in ids]
    payload: dict[str, Any] = {"status": _status(len(composers))}
    if composers:
        payload["composers"] = composers
    return payload


def _sparql(query: str) -> dict[str, Any]:
    bindings: list[dict[str, Any]] = []
    if "P1066" in query:
        bindings.append(
            {
                "a": {"type": "uri", "value": "http://www.wikidata.org/entity/Q7298"},
                "b": {"type": "uri", "value": "http://www.wikidata.org/entity/Q7294"},
                "type": {"type": "literal", "value": "influence_par"},
            }
        )
        return {"results": {"bindings": bindings}}
    for name, (item, birth, born, died, article) in WIKIDATA.items():
        if f'"{name}"@en' not in query:
            continue
        bindings.append(
            {
                "name": {"type": "literal", "value": name, "xml:lang": "en"},
                "item": {"type": "uri", "value": f"http://www.wikidata.org/entity/{item}"},
                "birth": {"type": "literal", "value": birth},
                "birthPlaceLabel": {"type": "literal", "value": born, "xml:lang": "fr"},
                "deathPlaceLabel": {"type": "literal", "value": died, "xml:lang": "fr"},
                "article": {"type": "uri", "value": f"https://fr.wikipedia.org/wiki/{article}"},
            }
        )
    return {"results": {"bindings": bindings}}


def _openopus(request: httpx.Request) -> httpx.Response:
    path = request.url.path
    if path == "/composer/list/pop.json":
        return httpx.Response(200, json=_composer_list(["112", "80"]))
    if path == "/composer/list/rec.json":
        return httpx.Response(200, json=_composer_list(["112"]))
    if path.startswith("/composer/list/name/"):
        letter = path.removeprefix("/composer/list/name/").removesuffix(".json")
        return httpx.Response(200, json=_composer_list(["300"] if letter == "s" else []))
    if path.startswith("/work/list/composer/"):
        works = WORKS.get(path.split("/")[4], [])
        payload: dict[str, Any] = {"status": _status(len(works))}
        if works:
            payload["works"] = works
        return httpx.Response(200, json=payload)
    return httpx.Response(404)


def _wikidata(request: httpx.Request) -> httpx.Response:
    query = parse_qs(request.url.query.decode())["query"][0]
    return httpx.Response(200, json=_sparql(query))


def _wikipedia(request: httpx.Request) -> httpx.Response:
    if "Brahms" in request.url.path:
        return httpx.Response(404, json={"title": "Not found."})
    return httpx.Response(
        200,
        json={
            "extract": "Antonín Dvořák est un compositeur tchèque.",
            "content_urls": {
                "desktop": {"page": "https://fr.wikipedia.org/wiki/Anton%C3%ADn_Dvo%C5%99%C3%A1k"}
            },
        },
    )


HANDLERS = {
    "api.openopus.org": _openopus,
    "query.wikidata.org": _wikidata,
    "fr.wikipedia.org": _wikipedia,
}


def _route(request: httpx.Request) -> httpx.Response:
    handler = HANDLERS.get(request.url.host)
    return handler(request) if handler else httpx.Response(404)


@pytest.fixture
def client() -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(_route))
