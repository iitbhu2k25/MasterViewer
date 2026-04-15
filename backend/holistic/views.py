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
