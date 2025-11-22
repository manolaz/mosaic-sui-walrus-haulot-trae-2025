export function decodeVecU8(v: any): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    try {
      const bytes = new Uint8Array(v as number[]);
      return new TextDecoder().decode(bytes);
    } catch {
      return "";
    }
  }
  return "";
}

