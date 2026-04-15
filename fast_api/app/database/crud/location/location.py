# app/database/crud/basic/basic.py
from typing import Any, overload
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.models.location.location import (
    Basic_district,
    Basic_state,
    Basic_subdistrict,
    Basic_village,
)


class BasicCrud:
    def __init__(self, db: Session):
        self.db = db

    def get_states(self):
        return self.db.query(Basic_state).order_by(Basic_state.state_name).all()

    def get_districts(self, state_code: int):
        return (
            self.db.query(Basic_district)
            .filter(Basic_district.state_code == state_code)
            .order_by(Basic_district.district_name)
            .all()
        )

    def get_subdistricts(self, district_codes: list[int]):
        return (
            self.db.query(Basic_subdistrict)
            .filter(Basic_subdistrict.district_code.in_(district_codes))
            .order_by(Basic_subdistrict.subdistrict_name)
            .all()
        )

    def get_villages(self, subdistrict_codes: list[int]):
        return (
            self.db.query(Basic_village)
            .filter(Basic_village.subdistrict_code.in_(subdistrict_codes))
            .order_by(Basic_village.village_name)
            .all()
        )

    