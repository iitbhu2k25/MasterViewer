import { NextRequest, NextResponse } from "next/server";

const geoserverBase = process.env.NEXT_ENV_GEOSERVER || "http://localhost:9090/geoserver";
const workspace = process.env.NEXT_ENV_GEOSERVER_WORKSAPACE || "dss_vector";
const BACKEND_BASE =
  process.env.NEXT_ENV_BACKEND_URL || process.env.NEXT_ENV_DJANGO_URL || process.env.NEXT_ENV_FAST_API || "http://localhost:8000";

const escapeCqlString = (value: string) => value.replace(/'/g, "''");

const buildCql = (field: string, value: string | null) => {
  if (!value) return "";
  return `${field}='${escapeCqlString(value)}'`;
};

const buildAnyFieldCql = (fields: string[], value: string | null) => {
  if (!value) return "";
  const escaped = escapeCqlString(value);
  return `(${fields.map((field) => `${field}='${escaped}'`).join(" OR ")})`;
};

const buildAnyFieldCqlWithPad = (fields: string[], value: string | null) => {
  if (!value) return "";
  const raw = value.trim();
  const padded = /^\d+$/.test(raw) ? raw.padStart(2, "0") : raw;
  const values = Array.from(new Set([raw, padded]));
  const clauses = fields.flatMap((field) => values.map((v) => `${field}='${escapeCqlString(v)}'`));
  return `(${clauses.join(" OR ")})`;
};

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  let bodyParams: Record<string, string> = {};
  if (request.method === "POST") {
    try {
      const json = (await request.json()) as Record<string, unknown>;
      bodyParams = Object.fromEntries(
        Object.entries(json || {}).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")]),
      );
    } catch {
      bodyParams = {};
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const action = bodyParams.action || searchParams.get("action");
  const layer = bodyParams.layer || searchParams.get("layer");
  const stateCode = bodyParams.stateCode || searchParams.get("stateCode");
  const stateName = bodyParams.stateName || searchParams.get("stateName");
  const district = bodyParams.district || searchParams.get("district");
  const districtCode = bodyParams.districtCode || searchParams.get("districtCode");

  if (action === "zone-raster") {
    try {
      const response = await fetch(`${BACKEND_BASE}/analysis/zone-raster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_zones: bodyParams.selected_zones ? JSON.parse(bodyParams.selected_zones) : [],
          operations: bodyParams.operations ? JSON.parse(bodyParams.operations) : [],
        }),
        cache: "no-store",
      });
      const text = await response.text();
      let payload: unknown = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { detail: text || "Invalid backend response" };
      }
      return NextResponse.json(payload, { status: response.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown backend connectivity error";
      return NextResponse.json(
        { detail: `Unable to run zone raster analysis. Backend not reachable at ${BACKEND_BASE}. ${message}` },
        { status: 500 },
      );
    }
  }

  if (!layer) {
    return NextResponse.json({ error: "Missing required query parameter: layer" }, { status: 400 });
  }

  try {
    const url = new URL(`${geoserverBase}/${workspace}/ows`);
    url.searchParams.set("service", "WFS");
    url.searchParams.set("version", "1.0.0");
    url.searchParams.set("request", "GetFeature");
    url.searchParams.set("typeName", `${workspace}:${layer}`);
    url.searchParams.set("outputFormat", "application/json");
    url.searchParams.set("srsName", "EPSG:4326");

    const cqlParts: string[] = [];
    if (layer === "B_State") {
      const stateCodeCql = buildAnyFieldCqlWithPad(["state_code", "STATE_CODE"], stateCode);
      const stateNameCql = buildCql("State", stateName);
      if (stateCodeCql) cqlParts.push(stateCodeCql);
      else if (stateNameCql) cqlParts.push(stateNameCql);
    }
    if (layer === "B_district") {
      const districtCodeCql = buildCql("DISTRICT_C", districtCode);
      const districtNameCql = buildCql("DISTRICT", district);
      const stateCodeCql = buildAnyFieldCqlWithPad(["STATE_CODE", "state_code"], stateCode);
      if (districtCodeCql) cqlParts.push(districtCodeCql);
      else if (districtNameCql) cqlParts.push(districtNameCql);
      if (stateCodeCql) cqlParts.push(stateCodeCql);
    }

    if (cqlParts.length > 0) {
      url.searchParams.set("CQL_FILTER", cqlParts.join(" AND "));
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { error: `GeoServer request failed (${response.status})`, geoserverUrl: url.toString() },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Holistic geoserver proxy API error:", error);
    return NextResponse.json({ error: "Failed to fetch geometry from GeoServer" }, { status: 500 });
  }
}
