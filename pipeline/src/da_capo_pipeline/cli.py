import argparse
import os
import sys
from pathlib import Path

from .build import build_reference
from .http import build_client


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="da-capo-import",
        description="Construit le fichier de référence de Da capo.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("../data/reference.json"),
        help="Fichier JSON à écrire (par défaut ../data/reference.json).",
    )
    parser.add_argument(
        "--scope",
        choices=("essential", "all"),
        default="all",
        help="Compositeurs à importer : les essentiels ou tout le catalogue Open Opus.",
    )
    parser.add_argument(
        "--skip-wikidata",
        action="store_true",
        help="Ne pas interroger Wikidata ni Wikipédia (pas de lieux, de liens ni de biographies).",
    )
    parser.add_argument(
        "--contact",
        default=os.environ.get("DA_CAPO_CONTACT", ""),
        help="E-mail ou URL de contact transmis aux API Wikimedia (exigé par leur politique).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if not args.skip_wikidata and not args.contact:
        print(
            "Indique un contact avec --contact ou DA_CAPO_CONTACT : Wikimedia l'exige.",
            file=sys.stderr,
        )
        return 2

    with build_client(args.contact or "da-capo") as client:
        reference = build_reference(
            client,
            scope=args.scope,
            with_wikidata=not args.skip_wikidata,
            progress=print,
        )

    output: Path = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(reference.model_dump_json(indent=1), encoding="utf-8")
    print(f"Écrit : {output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
