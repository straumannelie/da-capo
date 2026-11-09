import time
from collections.abc import Mapping
from typing import Any

import httpx

RETRYABLE = frozenset({429, 500, 502, 503, 504})


def get_json(
    client: httpx.Client,
    url: str,
    params: Mapping[str, str] | None = None,
    *,
    attempts: int = 4,
    backoff: float = 1.5,
) -> Any:
    for attempt in range(1, attempts + 1):
        response = client.get(url, params=params)
        if response.status_code not in RETRYABLE or attempt == attempts:
            response.raise_for_status()
            return response.json()
        retry_after = response.headers.get("retry-after", "")
        delay = float(retry_after) if retry_after.isdigit() else backoff**attempt
        time.sleep(delay)
    raise RuntimeError("unreachable")


def build_client(contact: str, timeout: float = 30.0) -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": f"da-capo-pipeline/0.1 ({contact})"},
        timeout=timeout,
        follow_redirects=True,
    )
