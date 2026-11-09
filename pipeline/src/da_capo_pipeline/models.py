from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

RelationType = Literal["eleve_de", "influence_par"]


class OpenOpusComposer(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    name: str
    complete_name: str
    birth: str | None = None
    death: str | None = None
    epoch: str

    @property
    def birth_year(self) -> int | None:
        return _year(self.birth)

    @property
    def death_year(self) -> int | None:
        return _year(self.death)


class OpenOpusWork(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    title: str
    subtitle: str = ""
    genre: str | None = None
    popular: bool = False
    recommended: bool = False


class OpenOpusStatus(BaseModel):
    success: bool
    error: str | None = None


class ComposerListResponse(BaseModel):
    status: OpenOpusStatus
    composers: list[OpenOpusComposer] = Field(default_factory=list)


class WorkListResponse(BaseModel):
    status: OpenOpusStatus
    works: list[OpenOpusWork] = Field(default_factory=list)


class WikidataProfile(BaseModel):
    model_config = ConfigDict(frozen=True)

    wikidata_id: str
    birth_place: str | None = None
    death_place: str | None = None
    article_url: str | None = None


class Biography(BaseModel):
    model_config = ConfigDict(frozen=True)

    text: str
    url: str


class ReferenceComposer(BaseModel):
    open_opus_id: int
    name: str
    complete_name: str
    birth_year: int | None
    death_year: int | None
    epoch: str
    popular: bool
    recommended: bool
    wikidata_id: str | None = None
    birth_place: str | None = None
    death_place: str | None = None
    bio: str | None = None
    bio_url: str | None = None


class ReferenceWork(BaseModel):
    open_opus_id: int
    composer_open_opus_id: int
    title: str
    title_fr: str | None
    subtitle: str | None
    genre: str | None
    popular: bool
    recommended: bool

    @field_validator("subtitle", "genre")
    @classmethod
    def empty_to_none(cls, value: str | None) -> str | None:
        return value or None


class ReferenceRelation(BaseModel):
    model_config = ConfigDict(frozen=True)

    from_open_opus_id: int
    to_open_opus_id: int
    type: RelationType


class Reference(BaseModel):
    version: Literal[1] = 1
    generated_at: datetime
    composers: list[ReferenceComposer]
    works: list[ReferenceWork]
    relations: list[ReferenceRelation]


def _year(value: str | None) -> int | None:
    if not value or len(value) < 4 or not value[:4].isdigit():
        return None
    return int(value[:4])
