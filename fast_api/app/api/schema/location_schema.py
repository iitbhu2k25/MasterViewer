# app/api/schema/basic_schema.py
from typing import Any, Literal

from pydantic import BaseModel, Field


class DistrictRequest(BaseModel):
    state_code: int


class SubdistrictRequest(BaseModel):
    district_code: int | list[int]


class VillageRequest(BaseModel):
    subdistrict_code: int | list[int]

