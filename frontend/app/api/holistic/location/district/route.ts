import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_ENV_BACKEND_URL || process.env.NEXT_ENV_DJANGO_URL || process.env.NEXT_ENV_FAST_API || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_BASE}/location/district`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
      cache: "no-store",
    });
    const text = await response.text();
    let payload: unknown = [];
    try {
      payload = text ? JSON.parse(text) : [];
    } catch {
      payload = [];
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Holistic district proxy API error:", error);
    return NextResponse.json({ error: "Unable to load district options from backend" }, { status: 500 });
  }
}
