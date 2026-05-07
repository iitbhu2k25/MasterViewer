// Shared store for phase raster outputs generated in /holistic page.
// Uses localStorage so /split page can read them without a server round-trip.

export type PhaseRasterEntry = {
  stageIndex: number;
  stageName: string;
  criteria: string[];
  weights: Record<string, number>;
  generatedAt: number; // timestamp ms
  tiffBase64: string;  // base64-encoded GeoTIFF bytes
};

const KEY_PREFIX = "holistic_phase_raster_";

function key(stageIndex: number) {
  return `${KEY_PREFIX}${stageIndex}`;
}

export function savePhaseRaster(entry: PhaseRasterEntry): void {
  try {
    localStorage.setItem(key(entry.stageIndex), JSON.stringify(entry));
    window.dispatchEvent(new StorageEvent("storage", { key: key(entry.stageIndex) }));
  } catch {
    // quota exceeded or SSR — ignore
  }
}

export function loadPhaseRaster(stageIndex: number): PhaseRasterEntry | null {
  try {
    const raw = localStorage.getItem(key(stageIndex));
    if (!raw) return null;
    return JSON.parse(raw) as PhaseRasterEntry;
  } catch {
    return null;
  }
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
