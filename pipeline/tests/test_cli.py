import json
from pathlib import Path

import httpx
import pytest

from da_capo_pipeline import cli


def test_contact_is_required_for_wikimedia(capsys: pytest.CaptureFixture[str]) -> None:
    assert cli.main(["--contact", ""]) == 2
    assert "contact" in capsys.readouterr().err


def test_writes_the_reference_file(
    tmp_path: Path, client: httpx.Client, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(cli, "build_client", lambda _contact: client)
    output = tmp_path / "data" / "reference.json"
    assert cli.main(["--output", str(output), "--scope", "essential", "--skip-wikidata"]) == 0
    written = json.loads(output.read_text("utf-8"))
    assert written["version"] == 1
    assert {composer["name"] for composer in written["composers"]} == {"Brahms", "Dvořák"}
