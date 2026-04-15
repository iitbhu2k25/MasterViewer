export const escapeCql = (value: string) => value.replace(/'/g, "''");

export const buildStateCodeCql = (stateCode: string) => {
  if (!stateCode) return "";
  const raw = stateCode.trim();
  const padded = /^\d+$/.test(raw) ? raw.padStart(2, "0") : raw;
  const escapedRaw = escapeCql(raw);
  const escapedPadded = escapeCql(padded);
  if (escapedRaw === escapedPadded) {
    return `state_code='${escapedRaw}'`;
  }
  return `(state_code='${escapedRaw}' OR state_code='${escapedPadded}')`;
};
