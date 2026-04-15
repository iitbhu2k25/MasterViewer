import { NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_ENV_BACKEND_URL || process.env.NEXT_ENV_DJANGO_URL || process.env.NEXT_ENV_FAST_API || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_BASE}/location/state`, { cache: "no-store" });
    const text = await response.text();
    let payload: unknown = [];
    try {
      payload = text ? JSON.parse(text) : [];
    } catch {
      payload = [];
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Holistic state proxy API error:", error);
    return NextResponse.json({ error: "Unable to load state options from backend" }, { status: 500 });
  }
}
