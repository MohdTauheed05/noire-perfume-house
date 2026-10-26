const hits = new Map<string, number[]>();
/** In-memory limiter (single instance). Use Redis/Upstash for multi-instance production. */
export function rateLimit(key: string, max = 8, windowMs = 60_000) {
  const now = Date.now(); const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr); return arr.length <= max;
}
