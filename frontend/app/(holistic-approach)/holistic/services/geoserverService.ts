import { FeatureCollection } from "../types/location";

const GEOSERVER_BASE = process.env.NEXT_ENV_GEOSERVER || "http://localhost:9090/geoserver";
const WORKSPACE = process.env.NEXT_ENV_GEOSERVER_WORKSAPACE || "dss_vector";

const escapeCql = (value: string) => value.replace(/'/g, "''");

const buildAnyFieldWithPad = (fields: string[], value?: string) => {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  const padded = /^\d+$/.test(raw) ? raw.padStart(2, "0") : raw;
  const unpadded = /^\d+$/.test(raw) ? String(Number(raw)) : raw;
  const values = Array.from(new Set([raw, padded, unpadded]));
  const clauses = fields.flatMap((field) => values.map((v) => `${field}='${escapeCql(v)}'`));
  return `(${clauses.join(" OR ")})`;
};

const buildField = (field: string, value?: string) => {
  if (!value) return "";
  const v = value.trim();
  if (!v) return "";
  return `${field}='${escapeCql(v)}'`;
};

const toTwoDigitCode = (value?: string) => {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  return /^\d+$/.test(raw) ? raw.padStart(2, "0") : raw;
};

const buildInClause = (field: string, value?: string) => {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) {
    const numeric = String(Number(raw));
    const escaped = escapeCql(raw);
    return `(${field} IN ('${escaped}') OR ${field} IN (${numeric}))`;
  }
  return `${field} IN ('${escapeCql(raw)}')`;
};

export const fetchLayerGeometry = async (
  layer: "B_State" | "B_district" | "Area" | "Rivers" | "basin_boundary",
  params: Record<string, string> = {},
): Promise<FeatureCollection> => {
  const cqlParts: string[] = [];
  if (layer === "B_State") {
    const selectedCode = toTwoDigitCode(params.stateCode);
    const stateCodeCql = selectedCode ? `state_code = '${escapeCql(selectedCode)}'` : "";
    const stateNameCql = buildField("State", params.stateName);
    if (stateCodeCql) cqlParts.push(stateCodeCql);
    else if (stateNameCql) cqlParts.push(stateNameCql);
  }
  if (layer === "B_district") {
    const districtCodeCql = buildInClause("DISTRICT_C", params.districtCode);
    const districtNameCql = buildField("DISTRICT", params.district);
    const stateCodeCql = buildAnyFieldWithPad(["STATE_CODE"], params.stateCode);
    if (districtCodeCql) cqlParts.push(districtCodeCql);
    else if (districtNameCql) cqlParts.push(districtNameCql);
    if (stateCodeCql) cqlParts.push(stateCodeCql);
  }
  if (layer === "Area") {
    const zoneField = params.zoneField;
    const zoneValue = params.zoneValue;
    if (zoneField && zoneValue) {
      cqlParts.push(buildField(zoneField, zoneValue));
    }
  }

  const url = new URL(`${GEOSERVER_BASE}/${WORKSPACE}/wfs`);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.0.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", `${WORKSPACE}:${layer}`);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("srsName", "EPSG:4326");
  if (cqlParts.length > 0) {
    url.searchParams.set("CQL_FILTER", cqlParts.join(" AND "));
  }

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load layer ${layer} (${response.status})`);
  }
  return (await response.json()) as FeatureCollection;
};
