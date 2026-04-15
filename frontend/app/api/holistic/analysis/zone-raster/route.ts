import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_ENV_BACKEND_URL || process.env.NEXT_ENV_DJANGO_URL || process.env.NEXT_ENV_FAST_API || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_BASE}/analysis/zone-raster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
      cache: "no-store",
    });
    const text = await response.text();
    let payload: unknown = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { detail: text || "Invalid response from backend" };
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Holistic analysis proxy API error:", error);
    const message = error instanceof Error ? error.message : "Unknown backend connectivity error";
    return NextResponse.json(
      {
        detail: `Unable to run zone raster analysis. Backend not reachable at ${BACKEND_BASE}. ${message}`,
      },
      { status: 500 },
    );
  }
}
