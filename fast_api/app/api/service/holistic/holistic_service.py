import json
import os
from functools import lru_cache
from typing import Any


class HolisticService:
    def _media_root(self) -> str:
        return os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "media")
        )

    def _district_shapefile(self) -> str:
        return os.path.join(
            self._media_root(),
            "shapefile",
            "District",
            "Districts.shp",
        )

    def _pick_column(self, columns: list[str], candidates: list[str]) -> str | None:
        lowered = {col.lower(): col for col in columns}

        for candidate in candidates:
            if candidate.lower() in lowered:
                return lowered[candidate.lower()]

        for col in columns:
            col_lower = col.lower()
            for candidate in candidates:
                token = candidate.lower()
                if token in col_lower:
                    return col
        return None

    @lru_cache(maxsize=1)
    def _load_district_data(self) -> tuple[Any, str | None, str | None, str | None, str]:
        gdf = self._load_district_data_from_shapefile()
        source = "local_shapefile"

        columns = list(gdf.columns)
        state_col = self._pick_column(
            columns,
            [
                "STATE",
                "STATE_NAME",
                "STATE_NM",
                "ST_NM",
                "STATENAME",
                "NAME_1",
            ],
        )
        district_col = self._pick_column(
            columns,
            [
                "DISTRICT",
                "DIST_NAME",
                "DISTRICT_N",
                "DISTRICTNA",
                "DISTRICT_NAME",
                "DTNAME",
                "NAME_2",
            ],
        )
        district_code_col = self._pick_column(
            columns,
            [
                "DIST_CODE",
                "DISTRICT_C",
                "DISTRICTCO",
                "DIST_CODE11",
                "DIST_CODE_",
                "DT_CODE",
            ],
        )

        return gdf, state_col, district_col, district_code_col, source

    def _load_district_data_from_shapefile(self) -> Any:
        try:
            import geopandas as gpd
        except ImportError as exc:
            raise RuntimeError("geopandas is required for holistic district map APIs") from exc

        shp_path = self._district_shapefile()
        if not os.path.exists(shp_path):
            raise FileNotFoundError(f"District shapefile not found: {shp_path}")

        gdf = gpd.read_file(shp_path)
        if gdf.crs is None:
            gdf = gdf.set_crs(epsg=4326, allow_override=True)
        else:
            gdf = gdf.to_crs(epsg=4326)
        return gdf

    def _normalize(self, value: Any) -> str:
        if value is None:
            return ""
        return str(value).strip()

    def district_locations(self, state: str | None = None, district: str | None = None) -> dict[str, Any]:
        gdf, state_col, district_col, district_code_col, source = self._load_district_data()
        full_gdf = gdf.copy()

        if state_col:
            full_gdf[state_col] = full_gdf[state_col].apply(self._normalize)
        if district_col:
            full_gdf[district_col] = full_gdf[district_col].apply(self._normalize)

        filtered = full_gdf
        state_value = self._normalize(state) if state else ""
        district_value = self._normalize(district) if district else ""

        if state_value and state_col:
            filtered = filtered[filtered[state_col].str.lower() == state_value.lower()]
        if district_value and district_col:
            filtered = filtered[filtered[district_col].str.lower() == district_value.lower()]

        options_scope = full_gdf
        if state_value and state_col:
            options_scope = options_scope[options_scope[state_col].str.lower() == state_value.lower()]

        state_options: list[dict[str, str]] = []
        if state_col:
            state_values = sorted({self._normalize(v) for v in full_gdf[state_col].dropna().tolist() if self._normalize(v)})
            state_options = [{"label": val, "value": val} for val in state_values]

        district_options: list[dict[str, str]] = []
        if district_col:
            district_values = sorted(
                {self._normalize(v) for v in options_scope[district_col].dropna().tolist() if self._normalize(v)}
            )
            district_options = [{"label": val, "value": val} for val in district_values]

        export_gdf = filtered.copy()
        export_gdf["state_name"] = (
            export_gdf[state_col].apply(self._normalize) if state_col else ""
        )
        export_gdf["district_name"] = (
            export_gdf[district_col].apply(self._normalize) if district_col else ""
        )
        export_gdf["district_code"] = (
            export_gdf[district_code_col].apply(self._normalize) if district_code_col else ""
        )

        keep_columns = ["state_name", "district_name", "district_code", "geometry"]
        export_gdf = export_gdf[keep_columns]
        geojson = json.loads(export_gdf.to_json())

        return {
            "filters": {
                "state": state_value or None,
                "district": district_value or None,
            },
            "columns_used": {
                "state": state_col,
                "district": district_col,
                "district_code": district_code_col,
            },
            "data_source": source,
            "state_options": state_options,
            "district_options": district_options,
            "subdistrict_options": [],
            "village_options": [],
            "total_features": int(len(export_gdf)),
            "geojson": geojson,
        }
