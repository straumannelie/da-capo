import json
import os
from datetime import UTC, datetime
from pathlib import Path

import httpx

from da_capo_pipeline.build import build_reference

SNAPSHOT = Path(__file__).parent / "fixtures" / "reference.snapshot.json"
FIXED_NOW = datetime(2026, 11, 9, 10, 0, tzinfo=UTC)


def test_build_assembles_catalog_profiles_relations_and_biographies(
    client: httpx.Client,
) -> None:
    messages: list[str] = []
    reference = build_reference(client, scope="all", progress=messages.append, now=FIXED_NOW)

    dvorak = next(composer for composer in reference.composers if composer.name == "Dvořák")
    suk = next(composer for composer in reference.composers if composer.name == "Suk")
    assert (dvorak.popular, dvorak.recommended, dvorak.birth_place) == (True, True, "Nelahozeves")
    assert dvorak.bio == "Antonín Dvořák est un compositeur tchèque."
    assert suk.wikidata_id is None
    assert [(work.title_fr, work.subtitle) for work in reference.works][:2] == [
        ("Symphonie n° 4 en mi mineur, op. 98", None),
        ("Concerto pour violoncelle en si mineur, op. 104", None),
    ]
    assert [relation.type for relation in reference.relations] == ["influence_par"]
    assert any("biographies" in message for message in messages)


def test_build_without_wikidata_keeps_the_catalog(client: httpx.Client) -> None:
    reference = build_reference(client, scope="essential", with_wikidata=False, now=FIXED_NOW)
    assert len(reference.composers) == 2
    assert reference.relations == []
    assert all(composer.bio is None for composer in reference.composers)


def test_output_matches_the_snapshot_shared_with_the_app(client: httpx.Client) -> None:
    reference = build_reference(client, scope="all", now=FIXED_NOW)
    produced = json.loads(reference.model_dump_json())
    if os.environ.get("UPDATE_SNAPSHOT") == "1":
        SNAPSHOT.write_text(json.dumps(produced, ensure_ascii=False, indent=1) + "\n", "utf-8")
    assert produced == json.loads(SNAPSHOT.read_text("utf-8"))
