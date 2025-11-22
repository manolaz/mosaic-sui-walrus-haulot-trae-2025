type Kind = "profile" | "event" | "organizer";

function keyFor(kind: Kind, id: string): string {
  return `walrus:${kind}:${id}`;
}

export function saveBlobId(kind: Kind, id: string, blobId: string): void {
  try {
    localStorage.setItem(keyFor(kind, id), blobId);
  } catch {
    void 0;
  }
}

export function loadBlobId(kind: Kind, id: string): string | null {
  try {
    return localStorage.getItem(keyFor(kind, id));
  } catch {
    return null;
  }
}
