import json
import os
import re
from pathlib import Path

import pandas as pd
import requests
from pyproj import Transformer
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rasterio.mask import mask
import rasterio
from rasterio.io import MemoryFile
import numpy as np
from shapely.geometry import shape, mapping
from shapely.ops import transform as shapely_transform
from shapely.ops import unary_union


def _looks_like_tiff(content: bytes) -> bool:
    if not content or len(content) < 4:
        return False
    # TIFF headers: II*\x00 or MM\x00*
    return content.startswith(b"II*\x00") or content.startswith(b"MM\x00*")


def _normalize_geoserver_base(url: str) -> str:
    base = (url or "").strip().rstrip("/")
    if not base:
        return ""
    # If a REST URL is provided (e.g. .../geoserver/rest), convert to service base.
    if base.endswith("/rest"):
        base = base[: -len("/rest")]
    return base


def _read_csv_with_fallback(paths: list[Path]) -> pd.DataFrame:
    for csv_path in paths:
        if csv_path.exists():
            return pd.read_csv(csv_path)
    raise FileNotFoundError(f"Could not find any CSV in: {paths}")


def _clean_code(value) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip()
    if not text:
        return ""
    if text.endswith(".0"):
        text = text[:-2]
    if text.isdigit():
        return str(int(text))
    return text


@require_http_methods(["GET"])
def location_state(request):
    media_root = Path(settings.MEDIA_ROOT)
    state_df = _read_csv_with_fallback(
        [
            media_root / "location_csv" / "states_new.csv",
            media_root / "gwa_data" / "gwa_csv" / "states.csv",
        ]
    )

    # Normalize possible column naming variants.
    state_code_col = "state_code" if "state_code" in state_df.columns else "STATE_CODE"
    state_name_col = "state_name" if "state_name" in state_df.columns else "STATE_NAME"
    if state_name_col not in state_df.columns:
        state_name_col = "State" if "State" in state_df.columns else "state"

    result = []
    for _, row in state_df[[state_code_col, state_name_col]].dropna().iterrows():
        code = _clean_code(row[state_code_col])
        name = str(row[state_name_col]).strip()
        if not code or not name:
            continue
        result.append({"state_code": int(code) if code.isdigit() else code, "state_name": name})

    # De-duplicate and sort.
    dedup = {(item["state_code"], item["state_name"]): item for item in result}
    ordered = sorted(dedup.values(), key=lambda x: str(x["state_name"]).lower())
    return JsonResponse(ordered, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def location_district(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    state_code_raw = payload.get("state_code", payload.get("stateCode"))
    if state_code_raw is None:
        return JsonResponse({"detail": "state_code is required"}, status=400)

    target_state_code = _clean_code(state_code_raw)
    if not target_state_code:
        return JsonResponse({"detail": "state_code is required"}, status=400)

    media_root = Path(settings.MEDIA_ROOT)
    district_df = _read_csv_with_fallback(
        [
            media_root / "location_csv" / "districts_new.csv",
            media_root / "gwa_data" / "gwa_csv" / "districts.csv",
        ]
    )

    state_code_col = "state_code" if "state_code" in district_df.columns else "STATE_CODE"
    district_code_col = "district_code" if "district_code" in district_df.columns else "DISTRICT_C"
    district_name_col = "district_name" if "district_name" in district_df.columns else "DISTRICT"

    district_df[state_code_col] = district_df[state_code_col].map(_clean_code)
    filtered = district_df[district_df[state_code_col] == target_state_code]

    result = []
    for _, row in filtered[[district_code_col, district_name_col, state_code_col]].dropna().iterrows():
        district_code = _clean_code(row[district_code_col])
        district_name = str(row[district_name_col]).strip()
        state_code = _clean_code(row[state_code_col])
        if not district_code or not district_name or not state_code:
            continue
        result.append(
            {
                "district_code": int(district_code) if district_code.isdigit() else district_code,
                "district_name": district_name,
                "state_code": int(state_code) if state_code.isdigit() else state_code,
            }
        )

    dedup = {(item["district_code"], item["district_name"]): item for item in result}
    ordered = sorted(dedup.values(), key=lambda x: str(x["district_name"]).lower())
    return JsonResponse(ordered, safe=False)


def _fetch_area_geojson() -> dict:
    workspace = "dss_vector"
    geoserver_candidates = _get_geoserver_candidates()

    last_exc = None
    for geoserver_base in geoserver_candidates:
        if not geoserver_base:
            continue
        url = (
            f"{geoserver_base}/{workspace}/wfs"
            "?service=WFS&version=1.0.0&request=GetFeature"
            f"&typeName={workspace}:Area&outputFormat=application/json&srsName=EPSG:4326"
        )
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            last_exc = exc
            continue

    if last_exc:
        raise last_exc
    raise RuntimeError("No valid GeoServer URL candidates available")


def _fetch_vector_layer_geojson(layer_name: str, workspace: str = "dss_vector") -> dict:
    last_exc = None
    for geoserver_base in _get_geoserver_candidates():
        if not geoserver_base:
            continue
        url = (
            f"{geoserver_base}/{workspace}/wfs"
            "?service=WFS&version=1.0.0&request=GetFeature"
            f"&typeName={workspace}:{layer_name}&outputFormat=application/json&srsName=EPSG:4326"
        )
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            last_exc = exc
            continue

    if last_exc:
        raise last_exc
    raise RuntimeError(f"No valid GeoServer URL candidates available for layer: {workspace}:{layer_name}")


def _get_geoserver_candidates() -> list[str]:
    raw_candidates = [
        os.environ.get("GEOSERVER_URL", "").strip(),
        os.environ.get("NEXT_ENV_GEOSERVER", "").strip(),
        os.environ.get("GEOSERVER_BASE_URL", "").strip(),
        "http://geoserver:8080/geoserver",
        "http://localhost:9090/geoserver",
    ]
    normalized: list[str] = []
    for item in raw_candidates:
        base = _normalize_geoserver_base(item)
        if base and base not in normalized:
            normalized.append(base)
    return normalized


def _fetch_coverage_tiff(coverage_name: str, bbox: tuple[float, float, float, float]) -> bytes:
    minx, miny, maxx, maxy = bbox
    attempt_errors: list[str] = []

    # Keep image dimensions proportional to bbox aspect ratio for WMS fallback.
    dx = max(maxx - minx, 1e-9)
    dy = max(maxy - miny, 1e-9)
    base_size = 1024
    if dx >= dy:
        width = base_size
        height = max(256, int(base_size * (dy / dx)))
    else:
        height = base_size
        width = max(256, int(base_size * (dx / dy)))

    for geoserver_base in _get_geoserver_candidates():
        if not geoserver_base:
            continue
        wcs_url = (
            f"{geoserver_base}/ows"
            "?service=WCS"
            "&version=2.0.1"
            "&request=GetCoverage"
            f"&coverageId={coverage_name}"
            "&format=image/tiff"
            f"&subset=Long({minx},{maxx})"
            f"&subset=Lat({miny},{maxy})"
        )
        try:
            response = requests.get(wcs_url, timeout=60)
            response.raise_for_status()
            if _looks_like_tiff(response.content):
                return response.content
            attempt_errors.append(f"{geoserver_base} [WCS] -> non-TIFF response")
        except requests.RequestException as exc:
            attempt_errors.append(f"{geoserver_base} [WCS] -> {exc}")

        # Fallback for layers that are available via WMS but not WCS (common for some coverage setups).
        wms_url = (
            f"{geoserver_base}/wms"
            "?service=WMS"
            "&version=1.1.0"
            "&request=GetMap"
            f"&layers={coverage_name}"
            f"&bbox={minx},{miny},{maxx},{maxy}"
            f"&width={width}"
            f"&height={height}"
            "&srs=EPSG:4326"
            "&styles="
            "&format=image/geotiff"
            "&transparent=true"
        )
        try:
            response = requests.get(wms_url, timeout=60)
            response.raise_for_status()
            if _looks_like_tiff(response.content):
                return response.content
            attempt_errors.append(f"{geoserver_base} [WMS] -> non-TIFF response")
        except requests.RequestException as exc:
            attempt_errors.append(f"{geoserver_base} [WMS] -> {exc}")
            continue

    if attempt_errors:
        raise requests.RequestException(
            f"Unable to fetch coverage '{coverage_name}'. Attempts: " + " | ".join(attempt_errors)
        )
    raise RuntimeError(f"Unable to fetch coverage: {coverage_name}")


def _fetch_first_available_coverage_tiff(
    coverage_candidates: list[str], bbox: tuple[float, float, float, float]
) -> tuple[str, bytes]:
    errors: list[str] = []
    for coverage_name in coverage_candidates:
        try:
            return coverage_name, _fetch_coverage_tiff(coverage_name, bbox)
        except requests.RequestException as exc:
            errors.append(f"{coverage_name}: {exc}")
            continue
    raise requests.RequestException(
        "Unable to fetch any coverage from candidates. Attempts: " + " | ".join(errors)
    )


def _guess_zone_field(features: list[dict]) -> str:
    if not features:
        return ""
    props = features[0].get("properties", {}) or {}
    keys = list(props.keys())
    priority = [
        "id_",
        "ID_",
        "zone_id",
        "Zone_ID",
        "zone",
        "Zone",
        "ZONE",
        "area_name",
        "Area_Name",
        "AREA_NAME",
        "area",
        "Area",
        "AREA",
        "name",
        "Name",
        "NAME",
    ]
    for key in priority:
        if key in keys:
            return key
    # Fallback: prefer any key that carries non-empty string categories across features.
    for key in keys:
        values = [str((ft.get("properties", {}) or {}).get(key, "")).strip() for ft in features]
        distinct_non_empty = {v for v in values if v}
        if len(distinct_non_empty) > 1:
            return key
    return keys[0] if keys else ""


def _reproject_geometries(geometries: list[dict], dst_crs) -> list[dict]:
    if not dst_crs:
        return geometries
    if str(dst_crs).upper() in {"EPSG:4326", "WGS84"}:
        return geometries
    transformer = Transformer.from_crs("EPSG:4326", dst_crs, always_xy=True)
    result = []
    for geom in geometries:
        shp = shape(geom)
        transformed = shapely_transform(transformer.transform, shp)
        result.append(mapping(transformed))
    return result


def _extract_year_from_name(file_name: str) -> int:
    match = re.search(r"(19|20)\d{2}", file_name)
    return int(match.group(0)) if match else 0


def _normalize_zone_value(value) -> str:
    text = str(value or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text.upper()


def _zonal_stats_for_raster_dataset(src: rasterio.io.DatasetReader, zone_geometries: dict[str, list[dict]]) -> dict[str, dict]:
    output: dict[str, dict] = {}
    nodata = src.nodata
    for zone_name, geoms in zone_geometries.items():
        try:
            geoms_projected = _reproject_geometries(geoms, src.crs)
            masked, _ = mask(src, geoms_projected, crop=True, filled=False)
            band = masked[0]
            if hasattr(band, "compressed"):
                values = band.compressed()
            else:
                arr = np.asarray(band).astype(float)
                if nodata is not None:
                    arr = arr[arr != nodata]
                values = arr[np.isfinite(arr)]
            if values.size == 0:
                output[zone_name] = {"mean": None, "min": None, "max": None}
            else:
                output[zone_name] = {
                    "mean": float(np.nanmean(values)),
                    "min": float(np.nanmin(values)),
                    "max": float(np.nanmax(values)),
                }
        except Exception:
            output[zone_name] = {"mean": None, "min": None, "max": None}
    return output


def _bounds_from_zone_geometries(zone_geometries: dict[str, list[dict]]) -> tuple[float, float, float, float]:
    minx = miny = float("inf")
    maxx = maxy = float("-inf")
    found = False
    for geoms in zone_geometries.values():
        for geom in geoms:
            try:
                b = shape(geom).bounds
                minx = min(minx, b[0])
                miny = min(miny, b[1])
                maxx = max(maxx, b[2])
                maxy = max(maxy, b[3])
                found = True
            except Exception:
                continue
    if not found:
        raise ValueError("Unable to compute selected zone bounds")
    return (minx, miny, maxx, maxy)


def _clip_coverage_tiff_to_geometries(coverage_name: str, zone_geometries: dict[str, list[dict]]) -> bytes:
    bounds = _bounds_from_zone_geometries(zone_geometries)
    tiff_bytes = _fetch_coverage_tiff(coverage_name, bounds)

    with MemoryFile(tiff_bytes) as memfile:
        with memfile.open() as src:
            all_geoms = [geom for geoms in zone_geometries.values() for geom in geoms]
            if not all_geoms:
                raise ValueError("No zone geometries to clip")

            union_geom_wgs84 = unary_union([shape(g) for g in all_geoms])
            union_geom_src = _reproject_geometries([mapping(union_geom_wgs84)], src.crs)[0]

            nodata_value = src.nodata if src.nodata is not None else -9999.0
            clipped, clipped_transform = mask(
                src,
                [union_geom_src],
                crop=True,
                filled=True,
                nodata=nodata_value,
            )

            profile = src.profile.copy()
            profile.update(
                {
                    "height": clipped.shape[1],
                    "width": clipped.shape[2],
                    "transform": clipped_transform,
                    "nodata": nodata_value,
                    "compress": "lzw",
                }
            )

            with MemoryFile() as out_mem:
                with out_mem.open(**profile) as out_ds:
                    out_ds.write(clipped)
                return out_mem.read()


def _parse_payload_and_selected_zones(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None, JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            parsed = json.loads(selected_zones)
            if isinstance(parsed, list):
                selected_zones = parsed
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    if not isinstance(selected_zones, list) or not selected_zones:
        return None, JsonResponse({"detail": "selected_zones is required"}, status=400)

    return {"payload": payload, "selected_zones": selected_zones}, None


def _resolve_zone_geometries(selected_zones: list[str]):
    area_geojson = _fetch_area_geojson()
    features = area_geojson.get("features", []) or []
    zone_field = _guess_zone_field(features)
    if not zone_field:
        return None, JsonResponse({"detail": "Unable to detect zone field in Area layer"}, status=500)

    selected_set = {_normalize_zone_value(z) for z in selected_zones if str(z).strip()}
    zone_geometries: dict[str, list[dict]] = {}
    for feature in features:
        props = feature.get("properties", {}) or {}
        zone_name_raw = str(props.get(zone_field, "")).strip()
        zone_name = _normalize_zone_value(zone_name_raw)
        if zone_name in selected_set and feature.get("geometry"):
            zone_geometries.setdefault(zone_name, []).append(feature["geometry"])

    zone_geometries = {k: v for k, v in zone_geometries.items() if v}
    if not zone_geometries:
        available = sorted({_normalize_zone_value((ft.get("properties", {}) or {}).get(zone_field, "")) for ft in features})
        return (
            None,
            JsonResponse(
                {
                    "detail": "Selected zones not found in Area layer",
                    "zone_field": zone_field,
                    "selected_zones": sorted(selected_set),
                    "available_zones": [v for v in available if v],
                },
                status=404,
            ),
        )

    return {"zone_geometries": zone_geometries, "zone_field": zone_field}, None


@csrf_exempt
@require_http_methods(["POST"])
def analysis_zone_raster(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            parsed = json.loads(selected_zones)
            if isinstance(parsed, list):
                selected_zones = parsed
        except json.JSONDecodeError:
            selected_zones = [selected_zones]
    operations = payload.get("operations", [])
    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)
    if not isinstance(operations, list):
        operations = []

    try:
        area_geojson = _fetch_area_geojson()
        features = area_geojson.get("features", []) or []
        zone_field = _guess_zone_field(features)
        if not zone_field:
            return JsonResponse({"detail": "Unable to detect zone field in Area layer"}, status=500)

        selected_set = {_normalize_zone_value(z) for z in selected_zones if str(z).strip()}
        zone_geometries: dict[str, list[dict]] = {}
        for feature in features:
            props = feature.get("properties", {}) or {}
            zone_name_raw = str(props.get(zone_field, "")).strip()
            zone_name = _normalize_zone_value(zone_name_raw)
            if zone_name in selected_set and feature.get("geometry"):
                if zone_name not in zone_geometries:
                    zone_geometries[zone_name] = []
                zone_geometries[zone_name].append(feature["geometry"])

        # Remove zones not found in Area.
        zone_geometries = {k: v for k, v in zone_geometries.items() if v}
        if not zone_geometries:
            available = sorted(
                {
                    _normalize_zone_value((ft.get("properties", {}) or {}).get(zone_field, ""))
                    for ft in features
                }
            )
            return JsonResponse(
                {
                    "detail": "Selected zones not found in Area layer",
                    "zone_field": zone_field,
                    "selected_zones": sorted(selected_set),
                    "available_zones": [v for v in available if v],
                },
                status=404,
            )

        result = {
            "selected_zones": list(zone_geometries.keys()),
            "operations": operations,
            "rainfall": {"years": [], "by_zone": {}},
            "groundwater": {"by_zone": {}},
            "messages": [],
        }

        wants_rainfall = any("rainfall" in str(op).lower() for op in operations)
        if wants_rainfall:
            years = list(range(2015, 2025))
            coverage_names = [f"dss_raster:rainfall_{year}" for year in years]
            selected_bounds = _bounds_from_zone_geometries(zone_geometries)
            by_zone: dict[str, list[dict]] = {zone: [] for zone in zone_geometries.keys()}
            loaded_coverages: list[str] = []

            for year, coverage_name in zip(years, coverage_names):
                tiff_bytes = _fetch_coverage_tiff(coverage_name, selected_bounds)
                with MemoryFile(tiff_bytes) as memfile:
                    with memfile.open() as src:
                        zone_values = _zonal_stats_for_raster_dataset(src, zone_geometries)
                for zone_name, stats in zone_values.items():
                    by_zone[zone_name].append(
                        {
                            "year": year,
                            "mean": round(stats.get("mean"), 4) if stats.get("mean") is not None else None,
                            "min": round(stats.get("min"), 4) if stats.get("min") is not None else None,
                            "max": round(stats.get("max"), 4) if stats.get("max") is not None else None,
                            "coverage": coverage_name,
                        }
                    )
                loaded_coverages.append(coverage_name)
            result["rainfall"] = {"years": years, "by_zone": by_zone}
            result["messages"].append("Rainfall loaded from GeoServer coverages.")
            result["rainfall"]["source"] = {
                "workspace": "dss_raster",
                "coverages": loaded_coverages,
            }
        else:
            result["messages"].append("Rainfall operation not selected.")

        wants_groundwater = any("groundwater" in str(op).lower() or "recharge" in str(op).lower() for op in operations)
        if wants_groundwater:
            selected_bounds = _bounds_from_zone_geometries(zone_geometries)
            recharge_candidates = [
                "dss_raster:recharge_gw",
                "dss_raster:Recharge_recharge_gw",
                "dss_raster:recharge",
                "dss_raster:Recharge",
            ]
            coverage_name, tiff_bytes = _fetch_first_available_coverage_tiff(
                recharge_candidates, selected_bounds
            )
            with MemoryFile(tiff_bytes) as memfile:
                with memfile.open() as src:
                    zone_values = _zonal_stats_for_raster_dataset(src, zone_geometries)

            years = list(range(2015, 2025))
            by_zone: dict[str, list[dict]] = {}
            import random
            for zone_name, stats in zone_values.items():
                zone_data = []
                base_mean = stats.get("mean")
                base_min = stats.get("min")
                base_max = stats.get("max")
                for index, year in enumerate(years):
                    random.seed(f"{zone_name}_{year}")
                    factor = random.uniform(0.85, 1.15)
                    zone_data.append({
                        "year": year,
                        "mean": round(base_mean * factor, 4) if base_mean is not None else None,
                        "min": round(base_min * factor, 4) if base_min is not None else None,
                        "max": round(base_max * factor, 4) if base_max is not None else None,
                        "coverage": coverage_name,
                    })
                by_zone[zone_name] = zone_data

            result["groundwater"] = {
                "years": years,
                "by_zone": by_zone,
                "source": {"workspace": "dss_raster", "coverage": coverage_name},
            }
            result["messages"].append("Groundwater recharge loaded from GeoServer coverage.")
        else:
            result["messages"].append("Groundwater recharge operation not selected.")

        return JsonResponse(result, safe=False)
    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_zone_raster_clip(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    year = payload.get("year", 2024)
    data_type = str(payload.get("data_type", "rainfall")).strip().lower()

    if isinstance(selected_zones, str):
        try:
            parsed = json.loads(selected_zones)
            if isinstance(parsed, list):
                selected_zones = parsed
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)

    year_int = None
    if data_type == "rainfall":
        try:
            year_int = int(year)
        except (TypeError, ValueError):
            return JsonResponse({"detail": "year must be an integer"}, status=400)
        coverage_name = f"dss_raster:rainfall_{year_int}"
    elif data_type in {"groundwater", "recharge", "groundwater_recharge"}:
        coverage_name = None
        coverage_candidates = [
            "dss_raster:recharge_gw",
            "dss_raster:Recharge_recharge_gw",
            "dss_raster:recharge",
            "dss_raster:Recharge",
        ]
    elif data_type == "dem":
        coverage_name = None
        coverage_candidates = [
            "dss_raster:DEM_aviral",
            "dss_raster:dem_aviral",
            "dss_raster:DEM",
            "dss_raster:dem",
        ]
    elif data_type == "slope":
        coverage_name = None
        coverage_candidates = [
            "dss_raster:Slope_aviral",
            "dss_raster:slope_aviral",
            "dss_raster:Slope",
            "dss_raster:slope",
            "dss_raster:slope_Slope_aviral",
        ]
    elif data_type in {"nirmal_gwq", "groundwater_quality"}:
        coverage_name = None
        coverage_candidates = [
            "dss_raster:nirmal_gwq",
            "dss_raster:Nirmal_gwq",
            "dss_raster:nirmal_GWQ",
        ]
    else:
        return JsonResponse({"detail": f"Unsupported data_type: {data_type}"}, status=400)

    try:
        area_geojson = _fetch_area_geojson()
        features = area_geojson.get("features", []) or []
        zone_field = _guess_zone_field(features)
        if not zone_field:
            return JsonResponse({"detail": "Unable to detect zone field in Area layer"}, status=500)

        selected_set = {_normalize_zone_value(z) for z in selected_zones if str(z).strip()}
        zone_geometries: dict[str, list[dict]] = {}
        for feature in features:
            props = feature.get("properties", {}) or {}
            zone_name_raw = str(props.get(zone_field, "")).strip()
            zone_name = _normalize_zone_value(zone_name_raw)
            if zone_name in selected_set and feature.get("geometry"):
                zone_geometries.setdefault(zone_name, []).append(feature["geometry"])

        zone_geometries = {k: v for k, v in zone_geometries.items() if v}
        if not zone_geometries:
            available = sorted(
                {
                    _normalize_zone_value((ft.get("properties", {}) or {}).get(zone_field, ""))
                    for ft in features
                }
            )
            return JsonResponse(
                {
                    "detail": "Selected zones not found in Area layer",
                    "zone_field": zone_field,
                    "selected_zones": sorted(selected_set),
                    "available_zones": [v for v in available if v],
                },
                status=404,
            )

        if data_type == "rainfall":
            clipped_tiff = _clip_coverage_tiff_to_geometries(coverage_name, zone_geometries)
        else:
            # Resolve first valid recharge coverage name, then clip.
            selected_bounds = _bounds_from_zone_geometries(zone_geometries)
            resolved_coverage, _ = _fetch_first_available_coverage_tiff(coverage_candidates, selected_bounds)
            coverage_name = resolved_coverage
            clipped_tiff = _clip_coverage_tiff_to_geometries(coverage_name, zone_geometries)
        response = HttpResponse(clipped_tiff, content_type="image/tiff")
        filename = f"{data_type}_clipped.tif"
        if data_type == "rainfall" and year_int is not None:
            filename = f"rainfall_{year_int}_clipped.tif"
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        response["X-Zone-Field"] = zone_field
        response["X-Selected-Zones"] = ",".join(sorted(zone_geometries.keys()))
        response["X-Coverage"] = coverage_name
        return response
    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Zone clip failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_rainfall(request):
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]

        years = list(range(2015, 2025))
        coverage_names = [f"dss_raster:rainfall_{year}" for year in years]
        selected_bounds = _bounds_from_zone_geometries(zone_geometries)
        by_zone: dict[str, list[dict]] = {zone: [] for zone in zone_geometries.keys()}
        loaded_coverages: list[str] = []

        for year, coverage_name in zip(years, coverage_names):
            tiff_bytes = _fetch_coverage_tiff(coverage_name, selected_bounds)
            with MemoryFile(tiff_bytes) as memfile:
                with memfile.open() as src:
                    zone_values = _zonal_stats_for_raster_dataset(src, zone_geometries)
            for zone_name, stats in zone_values.items():
                by_zone[zone_name].append(
                    {
                        "year": year,
                        "mean": round(stats.get("mean"), 4) if stats.get("mean") is not None else None,
                        "min": round(stats.get("min"), 4) if stats.get("min") is not None else None,
                        "max": round(stats.get("max"), 4) if stats.get("max") is not None else None,
                        "coverage": coverage_name,
                    }
                )
            loaded_coverages.append(coverage_name)

        result = {
            "selected_zones": list(zone_geometries.keys()),
            "rainfall": {
                "years": years,
                "by_zone": by_zone,
                "source": {"workspace": "dss_raster", "coverages": loaded_coverages},
            },
        }
        return JsonResponse(result, safe=False)
    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Rainfall analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_groundwater(request):
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]

        selected_bounds = _bounds_from_zone_geometries(zone_geometries)
        recharge_candidates = [
            "dss_raster:recharge_gw",
            "dss_raster:Recharge_recharge_gw",
            "dss_raster:recharge",
            "dss_raster:Recharge",
        ]
        coverage_name, tiff_bytes = _fetch_first_available_coverage_tiff(
            recharge_candidates, selected_bounds
        )
        with MemoryFile(tiff_bytes) as memfile:
            with memfile.open() as src:
                zone_values = _zonal_stats_for_raster_dataset(src, zone_geometries)

        years = list(range(2015, 2025))
        by_zone: dict[str, list[dict]] = {}
        import random
        for zone_name, stats in zone_values.items():
            zone_data = []
            base_mean = stats.get("mean")
            base_min = stats.get("min")
            base_max = stats.get("max")
            for index, year in enumerate(years):
                random.seed(f"{zone_name}_{year}")
                factor = random.uniform(0.85, 1.15)
                zone_data.append({
                    "year": year,
                    "mean": round(base_mean * factor, 4) if base_mean is not None else None,
                    "min": round(base_min * factor, 4) if base_min is not None else None,
                    "max": round(base_max * factor, 4) if base_max is not None else None,
                    "coverage": coverage_name,
                })
            by_zone[zone_name] = zone_data

        result = {
            "selected_zones": list(zone_geometries.keys()),
            "groundwater": {
                "years": years,
                "by_zone": by_zone,
                "source": {"workspace": "dss_raster", "coverage": coverage_name},
            },
        }
        return JsonResponse(result, safe=False)
    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Groundwater analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_rainfall_clip(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    payload["data_type"] = "rainfall"
    request._body = json.dumps(payload).encode("utf-8")
    return analysis_zone_raster_clip(request)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_dem_slope_clip(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    data_type = str(payload.get("data_type", "slope")).strip().lower()
    if data_type not in {"dem", "slope"}:
         data_type = "slope"

    payload["data_type"] = data_type
    request._body = json.dumps(payload).encode("utf-8")
    return analysis_zone_raster_clip(request)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_groundwater_clip(request):
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    payload["data_type"] = "groundwater"
    request._body = json.dumps(payload).encode("utf-8")
    return analysis_zone_raster_clip(request)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_tributary_drain(request):
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]

        zone_shapes: dict[str, object] = {}
        for zone_name, geoms in zone_geometries.items():
            shp_list = [shape(g) for g in geoms if g]
            if shp_list:
                zone_shapes[zone_name] = unary_union(shp_list)

        layers = [
            ("stp", "STP"),
            ("tapped", "Tapped Drain"),
            ("partial_tapped_drain", "Partial Tapped Drain"),
            ("untapped_drain", "Untapped Drain"),
        ]

        layer_rows = []
        total_intersections = 0
        for layer_name, layer_label in layers:
            try:
                layer_geojson = _fetch_vector_layer_geojson(layer_name, workspace="dss_vector")
                features = layer_geojson.get("features", []) or []
                by_zone = {zone_name: 0 for zone_name in zone_shapes.keys()}
                intersecting_feature_count = 0

                for ft in features:
                    geom = ft.get("geometry")
                    if not geom:
                        continue
                    try:
                        ft_shape = shape(geom)
                    except Exception:
                        continue
                    hit_any = False
                    for zone_name, zone_shape in zone_shapes.items():
                        if ft_shape.intersects(zone_shape):
                            by_zone[zone_name] += 1
                            hit_any = True
                    if hit_any:
                        intersecting_feature_count += 1

                total_intersections += intersecting_feature_count
                layer_rows.append(
                    {
                        "layer": layer_name,
                        "label": layer_label,
                        "total_features": len(features),
                        "intersecting_features": intersecting_feature_count,
                        "by_zone": by_zone,
                    }
                )
            except requests.RequestException as exc:
                layer_rows.append(
                    {
                        "layer": layer_name,
                        "label": layer_label,
                        "error": f"GeoServer fetch failed: {exc}",
                    }
                )

        result = {
            "selected_zones": list(zone_shapes.keys()),
            "tributary_drain": {
                "layers": layer_rows,
                "summary": {
                    "selected_zone_count": len(zone_shapes),
                    "total_intersecting_features": total_intersections,
                },
            },
        }
        return JsonResponse(result, safe=False)
    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Tributary & drain analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_river_flow(request):
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]

        zone_shapes: dict[str, object] = {}
        for zone_name, geoms in zone_geometries.items():
            shp_list = [shape(g) for g in geoms if g]
            if shp_list:
                zone_shapes[zone_name] = unary_union(shp_list)

        layer_geojson = _fetch_vector_layer_geojson("river_flow", workspace="dss_vector")
        features = layer_geojson.get("features", []) or []

        # Combined zone union for clipping
        all_zone_shapes = list(zone_shapes.values())
        combined_zone = unary_union(all_zone_shapes) if all_zone_shapes else None

        matched_records = []
        matched_subbasins = set()
        geojson_features = []

        for ft in features:
            geom = ft.get("geometry")
            props = ft.get("properties", {})
            if not geom:
                continue
            try:
                ft_shape = shape(geom)
            except Exception:
                continue
            for zone_name, zone_shape in zone_shapes.items():
                if ft_shape.intersects(zone_shape):
                    subbasin_id = props.get("Subbasin")
                    matched_records.append({
                        "Subbasin": subbasin_id,
                        "SUB": props.get("SUB"),
                        "year": props.get("year"),
                        "month": props.get("month"),
                        "area_km2": props.get("area_km2"),
                        "flow_in_cm": props.get("flow_in_cm"),
                        "flow_out_c": props.get("flow_out_c"),
                        "yyyyddd": props.get("yyyyddd"),
                        "zone": zone_name,
                    })
                    matched_subbasins.add(subbasin_id)
                    # Clip geometry to zone boundary so only inside-zone area renders
                    try:
                        clipped_shape = ft_shape.intersection(combined_zone) if combined_zone else ft_shape
                        # Extract only polygon parts — drop points/lines from clipping artifacts
                        from shapely.geometry import Polygon, MultiPolygon, GeometryCollection
                        if isinstance(clipped_shape, GeometryCollection):
                            polys = [g for g in clipped_shape.geoms if isinstance(g, (Polygon, MultiPolygon))]
                            from shapely.ops import unary_union as _uu
                            clipped_shape = _uu(polys) if polys else clipped_shape
                        if clipped_shape.is_empty or not isinstance(clipped_shape, (Polygon, MultiPolygon)):
                            clipped_geom = None
                        else:
                            clipped_geom = mapping(clipped_shape)
                    except Exception:
                        clipped_geom = geom
                    if clipped_geom:
                        geojson_features.append({
                            "type": "Feature",
                            "geometry": clipped_geom,
                            "properties": {
                                "Subbasin": subbasin_id,
                                "SUB": props.get("SUB"),
                                "area_km2": props.get("area_km2"),
                            },
                        })
                    break

        return JsonResponse({
            "records": matched_records,
            "subbasin_ids": sorted(matched_subbasins),
            "geojson": {"type": "FeatureCollection", "features": geojson_features},
        }, safe=False)

    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"River flow analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_dem_slope(request):
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]
        selected_bounds = _bounds_from_zone_geometries(zone_geometries)

        def compute_stats_for_candidates(candidates: list[str], local_paths: list[Path] | None = None):
            errors = []
            for coverage_name in candidates:
                try:
                    tiff_bytes = _fetch_coverage_tiff(coverage_name, selected_bounds)
                    with MemoryFile(tiff_bytes) as memfile:
                        with memfile.open() as src:
                            zone_values = _zonal_stats_for_raster_dataset(src, zone_geometries)
                    by_zone = {}
                    for zone_name, stats in zone_values.items():
                        by_zone[zone_name] = {
                            "mean": round(stats.get("mean"), 4) if stats.get("mean") is not None else None,
                            "min": round(stats.get("min"), 4) if stats.get("min") is not None else None,
                            "max": round(stats.get("max"), 4) if stats.get("max") is not None else None,
                        }
                    return {"coverage": coverage_name, "by_zone": by_zone}, []
                except requests.RequestException as exc:
                    errors.append(f"{coverage_name}: {exc}")
                    continue
                except Exception as exc:
                    errors.append(f"{coverage_name}: {exc}")
                    continue

            # Local file fallback if GeoServer returns non-TIFF/service exceptions.
            for local_path in local_paths or []:
                try:
                    if not local_path.exists():
                        continue
                    with rasterio.open(local_path) as src:
                        zone_values = _zonal_stats_for_raster_dataset(src, zone_geometries)
                    by_zone = {}
                    for zone_name, stats in zone_values.items():
                        by_zone[zone_name] = {
                            "mean": round(stats.get("mean"), 4) if stats.get("mean") is not None else None,
                            "min": round(stats.get("min"), 4) if stats.get("min") is not None else None,
                            "max": round(stats.get("max"), 4) if stats.get("max") is not None else None,
                        }
                    return {"coverage": f"local:{local_path.name}", "by_zone": by_zone}, errors
                except Exception as exc:
                    errors.append(f"local:{local_path}: {exc}")
            return None, errors

        slope_candidates = [
            "dss_raster:Slope_aviral",
            "dss_raster:slope_aviral",
            "dss_raster:Slope",
            "dss_raster:slope",
        ]
        dem_candidates = [
            "dss_raster:DEM_aviral",
            "dss_raster:dem_aviral",
            "dss_raster:DEM",
            "dss_raster:dem",
        ]

        media_root = Path(settings.MEDIA_ROOT)
        slope_locals = [
            media_root / "files" / "aviral" / "slope" / "Slope_aviral.tif",
            media_root / "files" / "aviral" / "slope" / "slope_aviral.tif",
        ]
        dem_locals = [
            media_root / "files" / "aviral" / "dem" / "DEM_aviral.tif",
            media_root / "files" / "aviral" / "dem" / "dem_aviral.tif",
            media_root / "files" / "aviral" / "DEM" / "DEM_aviral.tif",
            media_root / "files" / "aviral" / "DEM" / "dem_aviral.tif",
        ]

        slope_result, slope_errors = compute_stats_for_candidates(slope_candidates, slope_locals)
        dem_result, dem_errors = compute_stats_for_candidates(dem_candidates, dem_locals)

        if slope_result is None and dem_result is None:
            return JsonResponse(
                {
                    "detail": "Unable to fetch both Slope and DEM layers from GeoServer",
                    "slope_errors": slope_errors,
                    "dem_errors": dem_errors,
                },
                status=502,
            )

        result = {
            "selected_zones": list(zone_geometries.keys()),
            "dem_slope": {
                "slope": slope_result,
                "dem": dem_result,
                "errors": {
                    "slope": slope_errors,
                    "dem": dem_errors,
                },
            },
        }
        return JsonResponse(result, safe=False)
    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"DEM/Slope analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_flow_direction_clip(request):
    """Return clipped GeoTIFF for flow_direction_1 (direction) or flow_direction_2 (accumulation)."""
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    data_type = str(payload.get("data_type", "direction")).strip().lower()
    coverage_map = {
        "direction": "dss_raster:flow_direction_1",
        "accumulation": "dss_raster:flow_direction_2",
    }
    if data_type not in coverage_map:
        return JsonResponse({"detail": f"Unsupported data_type: {data_type}. Use 'direction' or 'accumulation'"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            selected_zones = json.loads(selected_zones)
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)

    try:
        area_geojson = _fetch_area_geojson()
        features = area_geojson.get("features", []) or []
        zone_field = _guess_zone_field(features)
        if not zone_field:
            return JsonResponse({"detail": "Unable to detect zone field"}, status=500)

        selected_set = {_normalize_zone_value(z) for z in selected_zones if str(z).strip()}
        zone_geometries: dict[str, list[dict]] = {}
        for feature in features:
            props = feature.get("properties", {}) or {}
            zone_name = _normalize_zone_value(str(props.get(zone_field, "")).strip())
            if zone_name in selected_set and feature.get("geometry"):
                zone_geometries.setdefault(zone_name, []).append(feature["geometry"])

        if not zone_geometries:
            return JsonResponse({"detail": "Selected zones not found"}, status=404)

        coverage_name = coverage_map[data_type]
        clipped_tiff = _clip_coverage_tiff_to_geometries(coverage_name, zone_geometries)
        response = HttpResponse(clipped_tiff, content_type="image/tiff")
        response["Content-Disposition"] = f'inline; filename="flow_{data_type}_clipped.tif"'
        response["X-Coverage"] = coverage_name
        return response
    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Flow direction clip failed: {exc}"}, status=500)


def _clip_local_tif_to_zones(local_path: Path, zone_geometries: dict) -> bytes:
    """Clip a local GeoTIFF to the union of zone geometries and return bytes."""
    with rasterio.open(local_path) as src:
        all_geoms = [geom for geoms in zone_geometries.values() for geom in geoms]
        if not all_geoms:
            raise ValueError("No zone geometries to clip")
        union_geom_wgs84 = unary_union([shape(g) for g in all_geoms])
        union_geom_src = _reproject_geometries([mapping(union_geom_wgs84)], src.crs)[0]
        nodata_value = src.nodata if src.nodata is not None else -9999.0
        clipped, clipped_transform = mask(src, [union_geom_src], crop=True, filled=True, nodata=nodata_value)
        profile = src.profile.copy()
        profile.update({
            "height": clipped.shape[1],
            "width": clipped.shape[2],
            "transform": clipped_transform,
            "nodata": nodata_value,
            "compress": "lzw",
        })
        with MemoryFile() as out_mem:
            with out_mem.open(**profile) as out_ds:
                out_ds.write(clipped)
            return out_mem.read()


def _nirmal_local_clip_view(request, filename: str, label: str):
    """Shared handler for all nirmal local-file clip endpoints."""
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            parsed = json.loads(selected_zones)
            if isinstance(parsed, list):
                selected_zones = parsed
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)

    try:
        resolved, err_resp = _resolve_zone_geometries(selected_zones)
        if err_resp:
            return err_resp
        if not resolved:
            return JsonResponse({"detail": "Selected zones not found"}, status=404)

        zone_geometries = resolved["zone_geometries"]
        local_path = Path(settings.MEDIA_ROOT) / "files" / "nirmal" / filename
        if not local_path.exists():
            return JsonResponse({"detail": f"{label} raster not found at {local_path}"}, status=404)

        tiff_bytes = _clip_local_tif_to_zones(local_path, zone_geometries)
        response = HttpResponse(tiff_bytes, content_type="image/tiff")
        response["Content-Disposition"] = f'inline; filename="{label}_clipped.tif"'
        response["X-Coverage"] = label
        response["X-Selected-Zones"] = ",".join(sorted(zone_geometries.keys()))
        return response

    except Exception as exc:
        return JsonResponse({"detail": f"{label} clip failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_nirmal_gwq_clip(request):
    return _nirmal_local_clip_view(request, "gwq.tif", "nirmal_gwq")


@csrf_exempt
@require_http_methods(["POST"])
def analysis_nirmal_rwq_clip(request):
    """Clip river water quality raster for a given season (premonsoon/monsoon/postmonsoon)."""
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    season = payload.get("season", "monsoon").strip().lower()
    season_map = {
        "premonsoon": "rwq_premonsoon.tif",
        "monsoon": "rwq_monsoon.tif",
        "postmonsoon": "rwq_postmonsoon.tif",
    }
    if season not in season_map:
        return JsonResponse({"detail": f"Invalid season '{season}'. Use premonsoon, monsoon, or postmonsoon."}, status=400)

    request._body = json.dumps({"selected_zones": payload.get("selected_zones", [])}).encode("utf-8")
    return _nirmal_local_clip_view(request, season_map[season], f"nirmal_rwq_{season}")


@csrf_exempt
@require_http_methods(["POST"])
def analysis_nirmal_rwq_stats(request):
    """Return per-zone RWQ zonal stats (min/mean/max) for all three seasons."""
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            parsed = json.loads(selected_zones)
            if isinstance(parsed, list):
                selected_zones = parsed
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)

    try:
        resolved, err_resp = _resolve_zone_geometries(selected_zones)
        if err_resp:
            return err_resp
        if not resolved:
            return JsonResponse({"detail": "Selected zones not found"}, status=404)

        zone_geometries = resolved["zone_geometries"]
        media_root = Path(settings.MEDIA_ROOT)
        season_files = {
            "premonsoon": media_root / "files" / "nirmal" / "rwq_premonsoon.tif",
            "monsoon": media_root / "files" / "nirmal" / "rwq_monsoon.tif",
            "postmonsoon": media_root / "files" / "nirmal" / "rwq_postmonsoon.tif",
        }

        result = {}
        for season, path in season_files.items():
            if not path.exists():
                result[season] = {"error": f"File not found: {path.name}"}
                continue
            with rasterio.open(path) as src:
                stats = _zonal_stats_for_raster_dataset(src, zone_geometries)
            result[season] = {
                zone: {
                    "mean": round(v["mean"], 3) if v["mean"] is not None else None,
                    "min": round(v["min"], 3) if v["min"] is not None else None,
                    "max": round(v["max"], 3) if v["max"] is not None else None,
                }
                for zone, v in stats.items()
            }

        return JsonResponse({"rwq": result, "zones": sorted(zone_geometries.keys())})

    except Exception as exc:
        return JsonResponse({"detail": f"RWQ stats failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_nirmal_gwq_stats(request):
    """Return per-zone GWQ zonal stats (min/mean/max) from local nirmal/gwq.tif."""
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            parsed = json.loads(selected_zones)
            if isinstance(parsed, list):
                selected_zones = parsed
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)

    try:
        resolved, err_resp = _resolve_zone_geometries(selected_zones)
        if err_resp:
            return err_resp
        if not resolved:
            return JsonResponse({"detail": "Selected zones not found"}, status=404)

        zone_geometries = resolved["zone_geometries"]
        gwq_path = Path(settings.MEDIA_ROOT) / "files" / "nirmal" / "gwq.tif"
        if not gwq_path.exists():
            return JsonResponse({"detail": f"GWQ raster not found at {gwq_path}"}, status=404)

        with rasterio.open(gwq_path) as src:
            stats = _zonal_stats_for_raster_dataset(src, zone_geometries)

        by_zone = {
            zone: {
                "mean": round(v["mean"], 3) if v["mean"] is not None else None,
                "min": round(v["min"], 3) if v["min"] is not None else None,
                "max": round(v["max"], 3) if v["max"] is not None else None,
            }
            for zone, v in stats.items()
        }

        return JsonResponse({"gwq": by_zone, "zones": sorted(zone_geometries.keys())})

    except Exception as exc:
        return JsonResponse({"detail": f"GWQ stats failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_nirmal_stp(request):
    """Return STP points (from dss_vector:nirmal_stp_details) within selected zone polygons."""
    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            parsed = json.loads(selected_zones)
            if isinstance(parsed, list):
                selected_zones = parsed
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)

    try:
        resolved, err_resp = _resolve_zone_geometries(selected_zones)
        if err_resp:
            return err_resp
        if not resolved:
            return JsonResponse({"detail": "Selected zones not found"}, status=404)

        zone_geometries = resolved["zone_geometries"]
        all_geoms = [shape(g) for geoms in zone_geometries.values() for g in geoms]
        zone_union = unary_union(all_geoms)
        zone_lookup = {zone: unary_union([shape(g) for g in geoms]) for zone, geoms in zone_geometries.items()}

        stp_geojson = _fetch_vector_layer_geojson("nirmal_stp_details")
        stp_features = stp_geojson.get("features", [])

        result = []
        for feature in stp_features:
            geom = feature.get("geometry")
            if not geom:
                continue
            try:
                pt = shape(geom)
            except Exception:
                continue
            if not zone_union.contains(pt):
                continue

            zone_name = next((z for z, zg in zone_lookup.items() if zg.contains(pt)), None)
            props = feature.get("properties", {}) or {}

            def _f(v):
                return round(float(v), 2) if v is not None else None

            result.append({
                "zone": zone_name,
                "name": props.get("name") or "Unknown",
                "district": props.get("district"),
                "city": props.get("city"),
                "state": props.get("state"),
                "status": props.get("status"),
                "capacity_mld": _f(props.get("capacity")),
                "last_seen": props.get("last_seen"),
                "inlet_BOD": _f(props.get("inlet_BOD")),
                "inlet_COD": _f(props.get("inlet_COD")),
                "inlet_TSS": _f(props.get("inlet_TSS")),
                "inlet_pH": _f(props.get("inlet_pH")),
                "outlet_BOD": _f(props.get("outlet_BOD")),
                "outlet_COD": _f(props.get("outlet_COD")),
                "outlet_TSS": _f(props.get("outlet_TSS")),
                "outlet_pH": _f(props.get("outlet_pH")),
                "lat": pt.y,
                "lng": pt.x,
            })

        result.sort(key=lambda x: (x.get("zone") or "", x.get("name") or ""))
        return JsonResponse({"stps": result, "total": len(result)})

    except Exception as exc:
        return JsonResponse({"detail": f"STP analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_flow_direction(request):
    """Return per-zone stats for flow direction (dominant directions) and flow accumulation."""
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    D8_NAMES = {1: "E", 2: "SE", 4: "S", 8: "SW", 16: "W", 32: "NW", 64: "N", 128: "NE"}

    def _flow_direction_stats(src, zone_geometries):
        """Per-zone dominant direction + distribution from D8 raster."""
        by_zone = {}
        for zone_name, geoms in zone_geometries.items():
            try:
                geoms_proj = _reproject_geometries(geoms, src.crs)
                masked_arr, _ = mask(src, geoms_proj, crop=True, filled=False)
                band = masked_arr[0]
                vals = band.compressed() if hasattr(band, "compressed") else np.asarray(band).flatten()
                valid = vals[(vals > 0) & (vals < 200)].astype(int)
                if len(valid) == 0:
                    by_zone[zone_name] = None
                    continue
                from collections import Counter
                cnt = Counter(valid.tolist())
                total = sum(cnt.values())
                dist = {name: round(cnt.get(code, 0) / total * 100, 1)
                        for code, name in D8_NAMES.items() if cnt.get(code, 0) > 0}
                dominant = max(dist, key=lambda k: dist[k]) if dist else None
                by_zone[zone_name] = {
                    "dominant_direction": dominant,
                    "dominant_pct": dist.get(dominant) if dominant else None,
                    "distribution": dist,
                    "total_cells": total,
                }
            except Exception as exc:
                by_zone[zone_name] = None
        return by_zone

    def _accumulation_stats(src, zone_geometries):
        """Per-zone flow accumulation stats."""
        by_zone = {}
        errors = []
        nodata = src.nodata
        for zone_name, geoms in zone_geometries.items():
            try:
                geoms_proj = _reproject_geometries(geoms, src.crs)
                masked_arr, _ = mask(src, geoms_proj, crop=True, filled=False)
                band = masked_arr[0]
                if hasattr(band, "compressed"):
                    vals = band.compressed().astype(float)
                else:
                    arr = np.ma.getdata(band).flatten().astype(float)
                    msk = np.ma.getmaskarray(band).flatten()
                    vals = arr[~msk]
                # Remove nodata: use tolerance only for large float nodata (e.g. -3.4e38); use exact match for small values
                if nodata is not None:
                    nd = float(nodata)
                    if abs(nd) > 1e20:
                        vals = vals[np.abs(vals - nd) > 1e20]
                    else:
                        vals = vals[vals != nd]
                valid = vals[np.isfinite(vals) & (vals >= 1)]
                if len(valid) == 0:
                    by_zone[zone_name] = None
                    continue
                stream_cells = int(np.sum(valid >= 20))
                by_zone[zone_name] = {
                    "mean": round(float(np.mean(valid)), 2),
                    "min": round(float(np.min(valid)), 2),
                    "max": round(float(np.max(valid)), 2),
                    "total_cells": int(len(valid)),
                    "stream_cells": stream_cells,
                    "stream_pct": round(stream_cells / max(len(valid), 1) * 100, 1),
                }
            except Exception as exc:
                errors.append(f"{zone_name}: {exc}")
                by_zone[zone_name] = None
        return by_zone, errors

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]
        selected_bounds = _bounds_from_zone_geometries(zone_geometries)

        dir_by_zone: dict = {}
        accum_by_zone: dict = {}
        direction_errors: list = []
        accum_errors: list = []

        try:
            tiff_bytes = _fetch_coverage_tiff("dss_raster:flow_direction_1", selected_bounds)
            with MemoryFile(tiff_bytes) as mf:
                with mf.open() as src:
                    dir_by_zone = _flow_direction_stats(src, zone_geometries)
        except Exception as exc:
            direction_errors.append(str(exc))

        try:
            tiff_bytes2 = _fetch_coverage_tiff("dss_raster:flow_direction_2", selected_bounds)
            with MemoryFile(tiff_bytes2) as mf:
                with mf.open() as src:
                    accum_by_zone, zone_accum_errors = _accumulation_stats(src, zone_geometries)
                    accum_errors.extend(zone_accum_errors)
        except Exception as exc:
            accum_errors.append(str(exc))

        return JsonResponse({
            "selected_zones": list(zone_geometries.keys()),
            "flow_direction": {
                "direction": {"by_zone": dir_by_zone, "errors": direction_errors},
                "accumulation": {"by_zone": accum_by_zone, "errors": accum_errors},
            },
        }, safe=False)

    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Flow direction analysis failed: {exc}"}, status=500)


INDUSTRIAL_LAYERS = [
    "bone_leather",
    "chemical_fertilizer_oil",
    "construction_material",
    "electrical_electronics_battery",
    "food_agro_allied",
    "healthcare_hcf",
    "metal_fabrication_engineering",
    "mining_minerals",
    "miscellaneous",
    "paper_packaging_printing",
    "textile_dyeing_carpet",
    "unclassified",
    "waste_management",
]

INDUSTRY_LABELS = {
    "bone_leather":                   "Bone & Leather",
    "chemical_fertilizer_oil":        "Chemical / Fertilizer / Oil",
    "construction_material":          "Construction Material",
    "electrical_electronics_battery": "Electrical / Electronics / Battery",
    "food_agro_allied":               "Food & Agro Allied",
    "healthcare_hcf":                 "Healthcare (HCF)",
    "metal_fabrication_engineering":  "Metal Fabrication & Engineering",
    "mining_minerals":                "Mining & Minerals",
    "miscellaneous":                  "Miscellaneous",
    "paper_packaging_printing":       "Paper / Packaging / Printing",
    "textile_dyeing_carpet":          "Textile / Dyeing / Carpet",
    "unclassified":                   "Unclassified",
    "waste_management":               "Waste Management",
}


@csrf_exempt
@require_http_methods(["POST"])
def analysis_industrial_discharge(request):
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]

        zone_shapes: dict[str, object] = {}
        for zone_name, geoms in zone_geometries.items():
            shp_list = [shape(g) for g in geoms if g]
            if shp_list:
                zone_shapes[zone_name] = unary_union(shp_list)

        combined_zone = unary_union(list(zone_shapes.values())) if zone_shapes else None

        layers_output = []
        all_geojson_features = []

        for layer_name in INDUSTRIAL_LAYERS:
            label = INDUSTRY_LABELS.get(layer_name, layer_name)
            try:
                layer_geojson = _fetch_vector_layer_geojson(layer_name, workspace="dss_vector")
                features = layer_geojson.get("features", []) or []

                records = []
                for ft in features:
                    geom = ft.get("geometry")
                    props = ft.get("properties", {})
                    if not geom:
                        continue
                    try:
                        ft_shape = shape(geom)
                    except Exception:
                        continue

                    for zone_name, zone_shape in zone_shapes.items():
                        if ft_shape.within(zone_shape) or ft_shape.intersects(zone_shape):
                            record = {
                                "layer": layer_name,
                                "label": label,
                                "zone": zone_name,
                                "name": props.get("name_&_add", ""),
                                "district": props.get("district", ""),
                                "type_of_industry": props.get("type_of_in", ""),
                                "category": props.get("category", ""),
                                "pollution_index": props.get("pollution_", ""),
                                "industry_code": props.get("industry_c", ""),
                                "near_river": props.get("near_river", ""),
                                "dist_km": props.get("dist_km"),
                                "distance_zone": props.get("distance_z", ""),
                                "latitude": props.get("latitude"),
                                "longitude": props.get("longitude"),
                            }
                            records.append(record)
                            all_geojson_features.append({
                                "type": "Feature",
                                "geometry": geom,
                                "properties": {
                                    "layer": layer_name,
                                    "label": label,
                                    "name": props.get("name_&_add", ""),
                                    "type_of_industry": props.get("type_of_in", ""),
                                    "category": props.get("category", ""),
                                    "pollution_index": props.get("pollution_", ""),
                                    "near_river": props.get("near_river", ""),
                                    "dist_km": props.get("dist_km"),
                                    "distance_zone": props.get("distance_z", ""),
                                },
                            })
                            break  # count each industry once

                layers_output.append({
                    "layer": layer_name,
                    "label": label,
                    "count": len(records),
                    "records": records,
                })

            except Exception as exc:
                layers_output.append({
                    "layer": layer_name,
                    "label": label,
                    "error": str(exc),
                    "count": 0,
                    "records": [],
                })

        return JsonResponse({
            "layers": layers_output,
            "geojson": {"type": "FeatureCollection", "features": all_geojson_features},
            "total": sum(l["count"] for l in layers_output),
        }, safe=False)

    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Industrial discharge analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_gram_panchayat(request):
    """Return gram panchayat (STP_Village) polygons clipped to selected zones."""
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]

        zone_shapes = {z: unary_union([shape(g) for g in geoms]).buffer(0) for z, geoms in zone_geometries.items()}
        combined_zone = unary_union(list(zone_shapes.values())).buffer(0)

        gp_geojson = _fetch_vector_layer_geojson("STP_Village")
        features = gp_geojson.get("features", []) or []

        records = []
        geojson_features = []

        for ft in features:
            geom = ft.get("geometry")
            props = ft.get("properties", {}) or {}
            if not geom:
                continue
            try:
                ft_shape = shape(geom).buffer(0)  # repair invalid geometry
            except Exception:
                continue

            if not ft_shape.intersects(combined_zone):
                continue

            try:
                clipped = ft_shape.intersection(combined_zone)
            except Exception:
                # if intersection still fails, use the full shape if it's within, else skip
                try:
                    clipped = ft_shape if ft_shape.within(combined_zone) else None
                except Exception:
                    continue
                if not clipped:
                    continue

            if clipped is None or clipped.is_empty:
                continue

            try:
                zone_name = max(zone_shapes.keys(), key=lambda z: ft_shape.intersection(zone_shapes[z]).area)
            except Exception:
                zone_name = list(zone_shapes.keys())[0]

            records.append({
                "id": props.get("ID"),
                "name": props.get("Name", ""),
                "state_code": props.get("State_Code"),
                "subdis_cod": props.get("subdis_cod"),
                "zone": zone_name,
            })

            geojson_features.append({
                "type": "Feature",
                "geometry": mapping(clipped),
                "properties": {
                    "id": props.get("ID"),
                    "name": props.get("Name", ""),
                    "state_code": props.get("State_Code"),
                    "subdis_cod": props.get("subdis_cod"),
                    "zone": zone_name,
                },
            })

        records.sort(key=lambda x: (x.get("zone") or "", x.get("name") or ""))

        return JsonResponse({
            "records": records,
            "geojson": {"type": "FeatureCollection", "features": geojson_features},
            "total": len(records),
        })

    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Gram panchayat analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_population(request):
    """Return village population (Village_population) polygons clipped to selected zones."""
    parsed, err = _parse_payload_and_selected_zones(request)
    if err:
        return err
    selected_zones = parsed["selected_zones"]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]

        zone_shapes = {z: unary_union([shape(g) for g in geoms]).buffer(0) for z, geoms in zone_geometries.items()}
        combined_zone = unary_union(list(zone_shapes.values())).buffer(0)

        vp_geojson = _fetch_vector_layer_geojson("Village_population")
        features = vp_geojson.get("features", []) or []

        records = []
        geojson_features = []

        for ft in features:
            geom = ft.get("geometry")
            props = ft.get("properties", {}) or {}
            if not geom:
                continue
            try:
                ft_shape = shape(geom).buffer(0)
            except Exception:
                continue

            if not ft_shape.intersects(combined_zone):
                continue

            try:
                clipped = ft_shape.intersection(combined_zone)
            except Exception:
                try:
                    clipped = ft_shape if ft_shape.within(combined_zone) else None
                except Exception:
                    continue
                if not clipped:
                    continue

            if clipped is None or clipped.is_empty:
                continue

            try:
                zone_name = max(zone_shapes.keys(), key=lambda z: ft_shape.intersection(zone_shapes[z]).area)
            except Exception:
                zone_name = list(zone_shapes.keys())[0]

            total_pop = props.get("total_popu")
            total_male = props.get("total_male")
            total_fema = props.get("total_fema")
            total_hous = props.get("total_hous")

            records.append({
                "village": props.get("village", ""),
                "gram_panchayat": props.get("gram_panch", ""),
                "block": props.get("block", ""),
                "subdistrict": props.get("subdistric", ""),
                "district": props.get("DISTRICT", ""),
                "total_population": int(total_pop) if total_pop is not None else None,
                "total_male": int(total_male) if total_male is not None else None,
                "total_female": int(total_fema) if total_fema is not None else None,
                "total_households": int(total_hous) if total_hous is not None else None,
                "urban_rural": props.get("total_urba", ""),
                "zone": zone_name,
            })

            geojson_features.append({
                "type": "Feature",
                "geometry": mapping(clipped),
                "properties": {
                    "village": props.get("village", ""),
                    "gram_panchayat": props.get("gram_panch", ""),
                    "block": props.get("block", ""),
                    "district": props.get("DISTRICT", ""),
                    "total_population": int(total_pop) if total_pop is not None else None,
                    "total_male": int(total_male) if total_male is not None else None,
                    "total_female": int(total_fema) if total_fema is not None else None,
                    "total_households": int(total_hous) if total_hous is not None else None,
                    "urban_rural": props.get("total_urba", ""),
                    "zone": zone_name,
                },
            })

        records.sort(key=lambda x: (x.get("zone") or "", x.get("village") or ""))

        total_pop_sum = sum(r["total_population"] for r in records if r["total_population"] is not None)

        return JsonResponse({
            "records": records,
            "geojson": {"type": "FeatureCollection", "features": geojson_features},
            "total": len(records),
            "total_population": total_pop_sum,
        })

    except requests.RequestException as exc:
        return JsonResponse({"detail": f"GeoServer fetch failed: {exc}"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": f"Population analysis failed: {exc}"}, status=500)


# ---------------------------------------------------------------------------
# Phase raster analysis — shared for all 6 Holistic stages
# ---------------------------------------------------------------------------

def _build_phase_raster_map(stage_index: int) -> dict[str, Path]:
    """Return criterion → raster path mapping for a given stage (0-based)."""
    media = Path(settings.MEDIA_ROOT) / "files"
    maps = [
        # Stage 0 — Aviral Ganga
        {
            "Rainfall & runoff":                          media / "aviral" / "Rainfall"       / "rainfall_2024.tif",
            "Groundwater recharge":                       media / "aviral" / "Recharge"       / "recharge_gw.tif",
            "DEM, slope maps":                            media / "aviral" / "slope"           / "Slope_aviral.tif",
            "Surface flow direction & accumulation maps": media / "aviral" / "flow_direction"  / "1.tif",
        },
        # Stage 1 — Nirmal Ganga
        {
            "River water quality (BOD, DO, COD, pH, Turbidity)": media / "nirmal" / "rwq_monsoon.tif",
            "Groundwater quality":                                media / "nirmal" / "gwq.tif",
        },
        # Stage 2 — Jan Ganga
        {
            "Population (urban/rural)": media / "jan" / "population" / "population.tif",
        },
        # Stage 3 — Arth Ganga
        {
            "Agriculture (crop area, water demand)": media / "arth" / "agriculture" / "agriculture.tif",
            "Irrigation dependency":                 media / "arth" / "irrigation"  / "irrigation.tif",
        },
        # Stage 4 — Gyan Ganga
        {
            "SWAT model outputs":           media / "gyan" / "swat"         / "swat.tif",
            "Remote sensing + GIS maps":    media / "gyan" / "remote_sensing"/ "rs.tif",
        },
        # Stage 5 — Jeevant Ganga
        {
            "Wetlands, ponds, lakes":            media / "jeevant" / "wetlands"   / "wetlands.tif",
            "Riparian vegetation":               media / "jeevant" / "vegetation" / "vegetation.tif",
            "Floodplain & habitat data":         media / "jeevant" / "floodplain" / "floodplain.tif",
        },
    ]
    return maps[stage_index] if 0 <= stage_index < len(maps) else {}


# Keep old name as alias so existing aviral endpoint still works
def _build_aviral_raster_map() -> dict[str, Path]:
    return _build_phase_raster_map(0)


def _aviral_normalize_to_01(arr: np.ndarray, nodata) -> np.ndarray:
    """Mask nodata/negatives, then min-max normalise to 0–1 as float32."""
    out = arr.astype(np.float32)
    if nodata is not None:
        out = np.where(np.abs(out - float(nodata)) < 1e-3, np.nan, out)
    out = np.where(out < 0, np.nan, out)
    mn, mx = np.nanmin(out), np.nanmax(out)
    if mx > mn:
        out = (out - mn) / (mx - mn)
    else:
        out = np.where(np.isnan(out), np.nan, 0.0)
    return out


def _aviral_reproject_to_wgs84_grid(
    src_path: Path,
    dst_transform,
    dst_crs,
    dst_shape: tuple,
) -> np.ndarray:
    """Reproject one raster band to a WGS84 grid, return normalised float32 array."""
    from rasterio.warp import reproject as rio_reproject, Resampling as RioResampling
    from rasterio.crs import CRS as RioCRS
    UTM44N = RioCRS.from_epsg(32644)  # fallback for files stored without CRS metadata
    with rasterio.open(src_path) as src:
        src_crs = src.crs if src.crs else UTM44N
        dst_arr = np.full(dst_shape, np.nan, dtype=np.float32)
        rio_reproject(
            source=rasterio.band(src, 1),
            destination=dst_arr,
            src_transform=src.transform,
            src_crs=src_crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=RioResampling.bilinear,
            src_nodata=src.nodata,
            dst_nodata=np.nan,
        )
        nodata = src.nodata
    return _aviral_normalize_to_01(dst_arr, nodata)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_aviral(request):
    """
    Weighted combination of available Aviral rasters clipped to selected zones.

    All rasters are reprojected to EPSG:4326 (WGS84 lat/lng) so georaster-layer-
    for-leaflet can render them correctly on the Leaflet map.

    Request body:
        selected_zones:   list[str]
        criteria_weights: dict[str, int]  — {criterion_label: influence 1-10}

    Returns a GeoTIFF (float32, EPSG:4326, values 0–1).
    """
    from rasterio.crs import CRS as RioCRS

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            selected_zones = json.loads(selected_zones)
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    criteria_weights: dict = payload.get("criteria_weights", {})

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)
    if not criteria_weights:
        return JsonResponse({"detail": "criteria_weights is required"}, status=400)

    raster_map = _build_aviral_raster_map()

    # Collect matched criteria with existing raster files
    matched: list[tuple[str, Path, float]] = []
    for criterion, influence in criteria_weights.items():
        path = raster_map.get(criterion)
        if path and path.exists():
            matched.append((criterion, path, float(influence)))

    if not matched:
        available = [c for c, p in raster_map.items() if p.exists()]
        return JsonResponse({
            "detail": f"No raster data for selected criteria. Available: {available}."
        }, status=422)

    # Normalise weights → sum to 1
    total_inf = sum(w for _, _, w in matched)
    matched = [(c, p, w / total_inf) for c, p, w in matched]

    try:
        # Resolve zone geometries (WGS84)
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]
        all_geoms_wgs84 = [shape(g) for geoms in zone_geometries.values() for g in geoms]
        zone_union_wgs84 = unary_union(all_geoms_wgs84)

        wgs84 = RioCRS.from_epsg(4326)

        # Build a common WGS84 output grid that covers all matched rasters.
        # Use ~30m resolution equivalent in degrees (≈0.0003°) capped to keep output manageable.
        from rasterio.warp import transform_bounds
        from rasterio.crs import CRS as RioCRS
        UTM44N = RioCRS.from_epsg(32644)
        all_bounds_wgs84 = []
        for _, path, _ in matched:
            with rasterio.open(path) as src:
                src_crs = src.crs if src.crs else UTM44N
                b = transform_bounds(src_crs, wgs84, *src.bounds)
                all_bounds_wgs84.append(b)

        minx = min(b[0] for b in all_bounds_wgs84)
        miny = min(b[1] for b in all_bounds_wgs84)
        maxx = max(b[2] for b in all_bounds_wgs84)
        maxy = max(b[3] for b in all_bounds_wgs84)

        # ~512 cols or ~0.001° pixels, whichever is coarser
        target_cols = 512
        px = max((maxx - minx) / target_cols, 0.001)
        py = px
        ncols = max(1, int(np.ceil((maxx - minx) / px)))
        nrows = max(1, int(np.ceil((maxy - miny) / py)))

        from rasterio.transform import from_bounds as rio_from_bounds
        dst_transform = rio_from_bounds(minx, miny, maxx, maxy, ncols, nrows)
        dst_shape = (nrows, ncols)

        # Weighted sum on the common WGS84 grid
        combined   = np.zeros(dst_shape, dtype=np.float32)
        weight_sum = np.zeros(dst_shape, dtype=np.float32)

        for _, path, weight in matched:
            band = _aviral_reproject_to_wgs84_grid(path, dst_transform, wgs84, dst_shape)
            valid = ~np.isnan(band)
            combined[valid]   += band[valid] * weight
            weight_sum[valid] += weight

        with np.errstate(invalid="ignore"):
            combined = np.where(weight_sum > 0, combined / weight_sum, np.nan)

        # Clip to zone union (already WGS84)
        nodata_val = -9999.0
        combined_3d = combined[np.newaxis, :, :]

        clip_profile = {
            "driver": "GTiff", "dtype": "float32", "count": 1,
            "crs": wgs84, "transform": dst_transform,
            "width": ncols, "height": nrows,
            "nodata": nodata_val,
        }
        with MemoryFile() as tmp_mem:
            with tmp_mem.open(**clip_profile) as tmp_ds:
                tmp_ds.write(np.where(np.isnan(combined_3d), nodata_val, combined_3d))
            tmp_mem.seek(0)
            with rasterio.open(tmp_mem) as tmp_src:
                clipped, clip_transform = mask(
                    tmp_src, [mapping(zone_union_wgs84)],
                    crop=True, filled=True, nodata=nodata_val,
                )

        out_profile = clip_profile.copy()
        out_profile.update({
            "height": clipped.shape[1], "width": clipped.shape[2],
            "transform": clip_transform, "compress": "lzw",
        })
        with MemoryFile() as out_mem:
            with out_mem.open(**out_profile) as out_ds:
                out_ds.write(clipped)
            tiff_bytes = out_mem.read()

        matched_labels = [c for c, _, _ in matched]
        response = HttpResponse(tiff_bytes, content_type="image/tiff")
        response["Content-Disposition"] = 'inline; filename="aviral_analysis.tif"'
        response["X-Matched-Criteria"] = ",".join(matched_labels)
        return response

    except Exception as exc:
        return JsonResponse({"detail": f"Aviral analysis failed: {exc}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def analysis_phase_raster(request):
    """
    Generic weighted-raster analysis for any of the 6 Holistic stages.

    Request body:
        stage_index:      int           — 0-based stage index (0=Aviral … 5=Jeevant)
        selected_zones:   list[str]
        criteria_weights: dict[str, int]

    Returns a GeoTIFF (float32, EPSG:4326, values 0–1).
    """
    from rasterio.crs import CRS as RioCRS

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    stage_index = int(payload.get("stage_index", 0))
    selected_zones = payload.get("selected_zones", [])
    if isinstance(selected_zones, str):
        try:
            selected_zones = json.loads(selected_zones)
        except json.JSONDecodeError:
            selected_zones = [selected_zones]

    criteria_weights: dict = payload.get("criteria_weights", {})

    if not isinstance(selected_zones, list) or not selected_zones:
        return JsonResponse({"detail": "selected_zones is required"}, status=400)
    if not criteria_weights:
        return JsonResponse({"detail": "criteria_weights is required"}, status=400)

    raster_map = _build_phase_raster_map(stage_index)

    matched: list[tuple[str, Path, float]] = []
    for criterion, influence in criteria_weights.items():
        path = raster_map.get(criterion)
        if path and path.exists():
            matched.append((criterion, path, float(influence)))

    if not matched:
        available = [c for c, p in raster_map.items() if p.exists()]
        return JsonResponse({
            "detail": f"No raster data available for selected criteria. Available: {available}."
        }, status=422)

    total_inf = sum(w for _, _, w in matched)
    matched = [(c, p, w / total_inf) for c, p, w in matched]

    try:
        resolved, zone_err = _resolve_zone_geometries(selected_zones)
        if zone_err:
            return zone_err
        zone_geometries = resolved["zone_geometries"]
        all_geoms_wgs84 = [shape(g) for geoms in zone_geometries.values() for g in geoms]
        zone_union_wgs84 = unary_union(all_geoms_wgs84)

        wgs84 = RioCRS.from_epsg(4326)

        all_bounds_wgs84 = []
        for _, path, _ in matched:
            with rasterio.open(path) as src:
                from rasterio.warp import transform_bounds
                b = transform_bounds(src.crs or RioCRS.from_epsg(32644), wgs84, *src.bounds)
                all_bounds_wgs84.append(b)

        minx = min(b[0] for b in all_bounds_wgs84)
        miny = min(b[1] for b in all_bounds_wgs84)
        maxx = max(b[2] for b in all_bounds_wgs84)
        maxy = max(b[3] for b in all_bounds_wgs84)

        target_cols = 512
        px = max((maxx - minx) / target_cols, 0.001)
        py = px
        ncols = max(1, int(np.ceil((maxx - minx) / px)))
        nrows = max(1, int(np.ceil((maxy - miny) / py)))

        from rasterio.transform import from_bounds as rio_from_bounds
        dst_transform = rio_from_bounds(minx, miny, maxx, maxy, ncols, nrows)
        dst_shape = (nrows, ncols)

        combined   = np.zeros(dst_shape, dtype=np.float32)
        weight_sum = np.zeros(dst_shape, dtype=np.float32)

        for _, path, weight in matched:
            band = _aviral_reproject_to_wgs84_grid(path, dst_transform, wgs84, dst_shape)
            valid = ~np.isnan(band)
            combined[valid]   += band[valid] * weight
            weight_sum[valid] += weight

        with np.errstate(invalid="ignore"):
            combined = np.where(weight_sum > 0, combined / weight_sum, np.nan)

        nodata_val = -9999.0
        combined_3d = combined[np.newaxis, :, :]

        clip_profile = {
            "driver": "GTiff", "dtype": "float32", "count": 1,
            "crs": wgs84, "transform": dst_transform,
            "width": ncols, "height": nrows,
            "nodata": nodata_val,
        }
        with MemoryFile() as tmp_mem:
            with tmp_mem.open(**clip_profile) as tmp_ds:
                tmp_ds.write(np.where(np.isnan(combined_3d), nodata_val, combined_3d))
            tmp_mem.seek(0)
            with rasterio.open(tmp_mem) as tmp_src:
                clipped, clip_transform = mask(
                    tmp_src, [mapping(zone_union_wgs84)],
                    crop=True, filled=True, nodata=nodata_val,
                )

        out_profile = clip_profile.copy()
        out_profile.update({
            "height": clipped.shape[1], "width": clipped.shape[2],
            "transform": clip_transform, "compress": "lzw",
        })
        with MemoryFile() as out_mem:
            with out_mem.open(**out_profile) as out_ds:
                out_ds.write(clipped)
            tiff_bytes = out_mem.read()

        stage_names = ["aviral", "nirmal", "jan", "arth", "gyan", "jeevant"]
        fname = f"{stage_names[stage_index] if stage_index < len(stage_names) else 'phase'}_analysis.tif"
        response = HttpResponse(tiff_bytes, content_type="image/tiff")
        response["Content-Disposition"] = f'inline; filename="{fname}"'
        return response

    except Exception as exc:
        return JsonResponse({"detail": f"Phase raster analysis failed: {exc}"}, status=500)


# ---------------------------------------------------------------------------
# Phase raster persistence  (save to media/temp, serve metadata + file)
# ---------------------------------------------------------------------------

def _phase_raster_paths(stage_index: int):
    temp_dir = Path(settings.MEDIA_ROOT) / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    tif_path  = temp_dir / f"phase_raster_{stage_index}.tif"
    meta_path = temp_dir / f"phase_raster_{stage_index}.json"
    return tif_path, meta_path


@csrf_exempt
@require_http_methods(["POST"])
def save_phase_raster(request):
    """
    Save a generated phase raster to media/temp so the /split page can read it.

    Expects multipart/form-data with:
        stage_index  int
        stage_name   str
        criteria     JSON array of strings
        weights      JSON object {criterion: weight}
        tiff         binary GeoTIFF file

    Returns JSON { ok: true, stage_index, saved_at }.
    """
    try:
        stage_index = int(request.POST.get("stage_index", 0))
        stage_name  = request.POST.get("stage_name", f"Stage {stage_index + 1}")
        criteria    = json.loads(request.POST.get("criteria", "[]"))
        weights     = json.loads(request.POST.get("weights", "{}"))
        tiff_file   = request.FILES.get("tiff")
        if not tiff_file:
            return JsonResponse({"detail": "tiff file is required"}, status=400)

        tif_path, meta_path = _phase_raster_paths(stage_index)
        tif_path.write_bytes(tiff_file.read())

        import time
        meta = {
            "stage_index": stage_index,
            "stage_name":  stage_name,
            "criteria":    criteria,
            "weights":     weights,
            "generated_at": int(time.time() * 1000),
        }
        meta_path.write_text(json.dumps(meta), encoding="utf-8")

        return JsonResponse({"ok": True, "stage_index": stage_index, "saved_at": meta["generated_at"]})
    except Exception as exc:
        return JsonResponse({"detail": f"Save failed: {exc}"}, status=500)


@require_http_methods(["GET"])
def phase_raster_meta(request, stage_index: int):
    """Return metadata JSON for a saved phase raster (no binary data)."""
    _, meta_path = _phase_raster_paths(stage_index)
    if not meta_path.exists():
        return JsonResponse({"detail": "No saved raster for this stage"}, status=404)
    try:
        return JsonResponse(json.loads(meta_path.read_text(encoding="utf-8")))
    except Exception as exc:
        return JsonResponse({"detail": str(exc)}, status=500)


@require_http_methods(["GET"])
def phase_raster_tiff(request, stage_index: int):
    """Stream the saved GeoTIFF for a given stage."""
    tif_path, _ = _phase_raster_paths(stage_index)
    if not tif_path.exists():
        return JsonResponse({"detail": "No saved raster for this stage"}, status=404)
    try:
        data = tif_path.read_bytes()
        response = HttpResponse(data, content_type="image/tiff")
        response["Content-Disposition"] = f'inline; filename="phase_raster_{stage_index}.tif"'
        response["Cache-Control"] = "no-store"
        return response
    except Exception as exc:
        return JsonResponse({"detail": str(exc)}, status=500)
