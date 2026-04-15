
import base64
import io
import json
import math
import os
import uuid
from typing import Any

import requests
from matplotlib import pyplot as plt
from sqlalchemy.orm import Session

from app.conf.settings import Settings
from app.database.crud.location.location import BasicCrud

class BasicService:
    def __init__(self, db: Session):
        self.db = db
        self.crud = BasicCrud(db)
        self.settings = Settings()
        self.temp_dir = self.settings.TEMP_DIR

    def get_states(self):
        rows = self.crud.get_states()
        return [{"state_code": row.state_code, "state_name": row.state_name} for row in rows]

    def get_districts(self, state_code: int):
        rows = self.crud.get_districts(state_code)
        return [{"district_code": row.district_code, "district_name": row.district_name, "state_code": row.state_code} for row in rows]

    def get_subdistricts(self, district_codes: list[int]):
        rows = self.crud.get_subdistricts(district_codes)
        return [{"subdistrict_code": row.subdistrict_code, "subdistrict_name": row.subdistrict_name, "district_code": row.district_code} for row in rows]

    def get_villages(self, subdistrict_codes: list[int]):
        rows = self.crud.get_villages(subdistrict_codes)
        return [
            {
                "village_code": row.village_code,
                "village_name": row.village_name,
                "population_2011": row.population_2011,
                "subdistrict_code": row.subdistrict_code,
            }
            for row in rows
        ]

    