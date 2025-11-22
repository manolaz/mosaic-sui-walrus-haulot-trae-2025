export function parseLocalDateTime(input: string): number {
  const t = new Date(input).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function isValidDateString(input: string): boolean {
  return Number.isFinite(new Date(input).getTime());
}

export function isValidRange(startInput: string, endInput: string): boolean {
  const a = parseLocalDateTime(startInput);
  const b = parseLocalDateTime(endInput);
  return a > 0 && b > 0 && b > a;
}

export function isValidRangeMs(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && b > a && a > 0 && b > 0;
}

export function toIsoFromMs(ms: number): string {
  return new Date(ms).toISOString();
}

export function toIsoFromInput(input: string): string {
  const ms = parseLocalDateTime(input);
  return new Date(ms).toISOString();
}

export function formatDateMs(ms: number): string {
  return new Date(ms).toLocaleDateString();
}

export function formatTimeMs(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRangeMs(a: number, b: number): string {
  const day = new Date(a).toLocaleDateString();
  const ta = formatTimeMs(a);
  const tb = formatTimeMs(b);
  return `${day} ${ta}–${tb}`;
}
