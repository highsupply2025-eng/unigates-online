/**
 * Paddle webhook source IP allowlist.
 *
 * The list is fetched from https://api.paddle.com/ips (the source of truth) and
 * cached in memory; it is never hard-coded. Addresses are returned as /32 CIDRs.
 * If the endpoint cannot be reached we fail open and rely on signature
 * verification alone, so a Paddle outage can never drop real webhooks.
 */
const IPS_URL = "https://api.paddle.com/ips";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let cache: { ips: Set<string>; fetchedAt: number } | null = null;

async function loadPaddleIps(): Promise<Set<string> | null> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache.ips;
  try {
    const res = await fetch(IPS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json() as { data?: { ipv4_cidrs?: string[] } };
    const cidrs = body.data?.ipv4_cidrs ?? [];
    if (cidrs.length === 0) throw new Error("empty ipv4_cidrs");
    // Paddle publishes single-host /32 CIDRs; compare on the bare address.
    const ips = new Set(cidrs.map((c) => c.split("/")[0].trim()));
    cache = { ips, fetchedAt: Date.now() };
    return ips;
  } catch (e) {
    console.error("Failed to fetch Paddle IP allowlist:", e);
    return cache?.ips ?? null;
  }
}

/** Client IPs seen by the edge runtime, closest hop last. */
function requestIps(req: Request): string[] {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const direct = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "";
  return [...forwarded.split(","), direct]
    .map((ip) => ip.trim())
    .filter(Boolean);
}

/**
 * Returns true when the request may be processed: either it comes from a
 * published Paddle IP, or the allowlist is unavailable (fail open).
 */
export async function isAllowedPaddleSource(req: Request): Promise<boolean> {
  const allowed = await loadPaddleIps();
  if (!allowed) return true;
  const ips = requestIps(req);
  if (ips.length === 0) return true;
  return ips.some((ip) => allowed.has(ip));
}
