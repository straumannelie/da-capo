from collections.abc import Callable
from datetime import UTC, datetime

import httpx

from . import openopus, wikidata
from .models import (
    Biography,
    Reference,
    ReferenceComposer,
    ReferenceRelation,
    ReferenceWork,
    WikidataProfile,
)
from .titles import translate_title

Progress = Callable[[str], None]


def _silent(_message: str) -> None:
    return None


def build_reference(
    client: httpx.Client,
    *,
    scope: openopus.Scope = "all",
    with_wikidata: bool = True,
    progress: Progress = _silent,
    now: datetime | None = None,
) -> Reference:
    catalog = openopus.fetch_catalog(client, scope)
    progress(f"{len(catalog.composers)} compositeurs trouvés sur Open Opus.")

    works: list[ReferenceWork] = []
    for index, composer in enumerate(catalog.composers, start=1):
        for work in openopus.fetch_works(client, composer.id):
            works.append(
                ReferenceWork(
                    open_opus_id=work.id,
                    composer_open_opus_id=composer.id,
                    title=work.title,
                    title_fr=translate_title(work.title),
                    subtitle=work.subtitle,
                    genre=work.genre,
                    popular=work.popular,
                    recommended=work.recommended,
                )
            )
        if index % 25 == 0:
            progress(f"Œuvres : {index}/{len(catalog.composers)} compositeurs traités.")
    progress(f"{len(works)} œuvres récupérées.")

    profiles: dict[int, WikidataProfile] = {}
    relations: list[ReferenceRelation] = []
    biographies: dict[int, Biography] = {}
    if with_wikidata:
        profiles = wikidata.match_composers(client, catalog.composers)
        progress(f"{len(profiles)} compositeurs reliés à Wikidata.")
        by_wikidata = {
            profile.wikidata_id: composer_id for composer_id, profile in profiles.items()
        }
        for source, target, kind in sorted(wikidata.fetch_relations(client, by_wikidata.keys())):
            relations.append(
                ReferenceRelation(
                    from_open_opus_id=by_wikidata[source],
                    to_open_opus_id=by_wikidata[target],
                    type=kind,
                )
            )
        progress(f"{len(relations)} liens entre compositeurs.")
        for composer_id, profile in profiles.items():
            if profile.article_url:
                biography = wikidata.fetch_biography(client, profile.article_url)
                if biography is not None:
                    biographies[composer_id] = biography
        progress(f"{len(biographies)} biographies récupérées sur Wikipédia.")

    composers = []
    for composer in catalog.composers:
        matched = profiles.get(composer.id)
        biography = biographies.get(composer.id)
        composers.append(
            ReferenceComposer(
                open_opus_id=composer.id,
                name=composer.name,
                complete_name=composer.complete_name,
                birth_year=composer.birth_year,
                death_year=composer.death_year,
                epoch=composer.epoch,
                popular=composer.id in catalog.popular_ids,
                recommended=composer.id in catalog.recommended_ids,
                wikidata_id=matched.wikidata_id if matched else None,
                birth_place=matched.birth_place if matched else None,
                death_place=matched.death_place if matched else None,
                bio=biography.text if biography else None,
                bio_url=biography.url if biography else None,
            )
        )

    return Reference(
        generated_at=now or datetime.now(UTC),
        composers=composers,
        works=works,
        relations=relations,
    )
