import httpx

from da_capo_pipeline.openopus import fetch_catalog, fetch_works


def test_essential_scope_merges_popular_and_recommended(client: httpx.Client) -> None:
    catalog = fetch_catalog(client, "essential")
    assert [composer.name for composer in catalog.composers] == ["Brahms", "Dvořák"]
    assert catalog.popular_ids == {112, 80}
    assert catalog.recommended_ids == {112}


def test_all_scope_walks_every_letter(client: httpx.Client) -> None:
    catalog = fetch_catalog(client, "all")
    assert [composer.name for composer in catalog.composers] == ["Brahms", "Dvořák", "Suk"]
    assert catalog.composers[2].birth_year == 1874


def test_works_are_parsed_and_empty_lists_tolerated(client: httpx.Client) -> None:
    works = fetch_works(client, 112)
    assert [(work.id, work.popular, work.genre) for work in works] == [
        (9001, True, "Orchestral"),
        (9002, True, "Stage"),
    ]
    assert fetch_works(client, 300) == []
