import { DistrictResponse, StateResponse } from "../types/location";

let stateRequest: Promise<StateResponse> | null = null;
const districtRequestByState = new Map<string, Promise<DistrictResponse>>();

const fetchJsonLoose = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, { cache: "no-store", ...init });
  let payload: unknown = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  return { ok: response.ok, status: response.status, payload };
};

const asArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  return [];
};

const pickFirstNonEmptyArray = (payload: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const arr = asArray(payload[key]);
    if (arr.length > 0) return arr;
  }
  return [] as Record<string, unknown>[];
};

const pickArray = (payload: Record<string, unknown>) =>
  pickFirstNonEmptyArray(payload, ["state_options", "states", "data", "results"]);

const pickDistrictArray = (payload: Record<string, unknown>) =>
  pickFirstNonEmptyArray(payload, ["district_options", "districts", "data", "results"]);

const unwrapNestedPayload = (payload: Record<string, unknown>) => {
  const nestedData = payload.data;
  if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
    return nestedData as Record<string, unknown>;
  }
  return payload;
};

const readString = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
};

const normalizeStateResponse = (raw: unknown): StateResponse => {
  if (Array.isArray(raw)) {
    const mapped = (raw as Record<string, unknown>[])
      .map((item) => {
        const stateCode = readString(item, ["stateCode", "state_code", "STATE_CODE", "code", "value"]);
        const stateName = readString(item, ["state_name", "label", "state", "State", "STATE_1", "STATE", "name", "value"]);
        if (!stateCode || !stateName) return null;
        return { label: stateName, value: stateCode, stateCode };
      })
      .filter(Boolean) as StateResponse["state_options"];
    return { state_options: mapped };
  }

  const payload = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const basePayload = unwrapNestedPayload(payload);
  const candidate = pickArray(basePayload).length > 0 ? pickArray(basePayload) : pickArray(payload);
  const mapped = candidate
    .map((item) => {
      const stateCode = readString(item, ["stateCode", "state_code", "STATE_CODE", "code", "value"]);
      const stateName = readString(item, ["state_name", "label", "state", "State", "STATE_1", "STATE", "name", "value"]);
      if (!stateCode || !stateName) return null;
      return { label: stateName, value: stateCode, stateCode };
    })
    .filter(Boolean) as StateResponse["state_options"];

  return { state_options: mapped };
};

const normalizeDistrictResponse = (raw: unknown): DistrictResponse => {
  if (Array.isArray(raw)) {
    const mapped = (raw as Record<string, unknown>[])
      .map((item) => {
        const districtCode = readString(item, ["districtCode", "district_code", "DISTRICT_C", "code", "value"]);
        const districtName = readString(item, ["district_name", "label", "district", "DISTRICT", "name"]);
        const stateCode = readString(item, ["stateCode", "state_code", "STATE_CODE"]);
        const stateName = readString(item, ["state_name", "stateName", "state", "State", "STATE_1", "STATE"]);
        if (!districtCode || !districtName) return null;
        return {
          label: districtName,
          value: districtCode,
          districtCode,
          stateCode,
          stateName,
        };
      })
      .filter(Boolean) as DistrictResponse["district_options"];
    return { district_options: mapped };
  }

  const payload = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const basePayload = unwrapNestedPayload(payload);
  const candidate =
    pickDistrictArray(basePayload).length > 0 ? pickDistrictArray(basePayload) : pickDistrictArray(payload);
  const mapped = candidate
    .map((item) => {
      const districtCode = readString(item, ["districtCode", "district_code", "DISTRICT_C", "code", "value"]);
      const districtName = readString(item, ["district_name", "label", "district", "DISTRICT", "name"]);
      const stateCode = readString(item, ["stateCode", "state_code", "STATE_CODE"]);
      const stateName = readString(item, ["state_name", "stateName", "state", "State", "STATE_1", "STATE"]);
      if (!districtCode || !districtName) return null;
      return {
        label: districtName,
        value: districtCode,
        districtCode,
        stateCode,
        stateName,
      };
    })
    .filter(Boolean) as DistrictResponse["district_options"];

  return { district_options: mapped };
};

export const fetchStateOptions = async () => {
  if (!stateRequest) {
    stateRequest = (async () => {
      const { ok, status, payload } = await fetchJsonLoose(`/api/holistic/location/state`);
      const normalized = normalizeStateResponse(payload);
      if (!ok && normalized.state_options.length === 0) {
        throw new Error(`Request failed (${status}) for /api/holistic/location/state`);
      }
      return normalized;
    })();
    stateRequest = stateRequest.catch((err) => {
      stateRequest = null;
      throw err;
    });
  }
  return stateRequest;
};

export const fetchDistrictOptionsByState = async (stateCode: string) => {
  if (!stateCode) {
    return { district_options: [] };
  }
  if (!districtRequestByState.has(stateCode)) {
    districtRequestByState.set(
      stateCode,
      (async () => {
        const { ok, status, payload } = await fetchJsonLoose(`/api/holistic/location/district`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state_code: stateCode,
            stateCode,
          }),
        });
        const normalized = normalizeDistrictResponse(payload);
        if (!ok && normalized.district_options.length === 0) {
          throw new Error(`Request failed (${status}) for /api/holistic/location/district`);
        }
        return normalized;
      })(),
    );
    const request = districtRequestByState.get(stateCode)!;
    districtRequestByState.set(
      stateCode,
      request.catch((err) => {
        districtRequestByState.delete(stateCode);
        throw err;
      }),
    );
  }
  return districtRequestByState.get(stateCode)!;
};

export const resetLocationRequestCache = () => {
  stateRequest = null;
  districtRequestByState.clear();
};
