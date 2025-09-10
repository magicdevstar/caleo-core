export const DEFAULT_VIEW = { longitude: -96.9, latitude: 37.6, zoom: 15 };

export function ensureClosedRing(ring: number[][]): number[][] {
  if (!ring || ring.length === 0) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx === lx && fy === ly) return ring;
  return [...ring, [fx, fy]];
}

export function stripClosingCoord(ring: number[][]): number[][] {
  if (ring.length < 2) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  return fx === lx && fy === ly ? ring.slice(0, -1) : ring;
}

// Normalize a ring for equality checks: remove closing coord, round values, and rotate to stable start
export function normalizeRing(ring?: number[][] | null): number[][] | null {
  if (!ring || ring.length < 3) return null;
  const open = stripClosingCoord(ring);
  const rounded = open.map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))]);
  // Find stable start by lexicographic min
  let start = 0;
  for (let i = 1; i < rounded.length; i += 1) {
    const [ax, ay] = rounded[i];
    const [bx, by] = rounded[start];
    if (ax < bx || (ax === bx && ay < by)) start = i;
  }
  return [...rounded.slice(start), ...rounded.slice(0, start)];
}

export function ringsEqual(a?: number[][] | null, b?: number[][] | null): boolean {
  const na = normalizeRing(a);
  const nb = normalizeRing(b);
  return JSON.stringify(na) === JSON.stringify(nb);
}