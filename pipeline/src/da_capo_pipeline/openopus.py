import string
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Literal

import httpx

from .http import get_json
from .models import ComposerListResponse, OpenOpusComposer, OpenOpusWork, WorkListResponse

BASE_URL = "https://api.openopus.org"

Scope = Literal["essential", "all"]


@dataclass(frozen=True)
class ComposerCatalog:
    composers: tuple[OpenOpusComposer, ...]
    popular_ids: frozenset[int]
    recommended_ids: frozenset[int]


def _composers(client: httpx.Client, path: str) -> list[OpenOpusComposer]:
    payload = ComposerListResponse.model_validate(get_json(client, f"{BASE_URL}{path}"))
    return payload.composers if payload.status.success else []


def _unique(composers: Iterable[OpenOpusComposer]) -> tuple[OpenOpusComposer, ...]:
    by_id = {composer.id: composer for composer in composers}
    return tuple(sorted(by_id.values(), key=lambda composer: (composer.birth or "", composer.id)))


def fetch_catalog(client: httpx.Client, scope: Scope) -> ComposerCatalog:
    popular = _composers(client, "/composer/list/pop.json")
    recommended = _composers(client, "/composer/list/rec.json")
    composers = [*popular, *recommended]
    if scope == "all":
        for letter in string.ascii_lowercase:
            composers.extend(_composers(client, f"/composer/list/name/{letter}.json"))
    return ComposerCatalog(
        composers=_unique(composers),
        popular_ids=frozenset(composer.id for composer in popular),
        recommended_ids=frozenset(composer.id for composer in recommended),
    )


def fetch_works(client: httpx.Client, composer_id: int) -> list[OpenOpusWork]:
    payload = WorkListResponse.model_validate(
        get_json(client, f"{BASE_URL}/work/list/composer/{composer_id}/genre/all.json")
    )
    return payload.works if payload.status.success else []
