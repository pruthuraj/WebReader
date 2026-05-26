// Per-host request pacing for live source fetches. Serializes requests to a
// given host (single in-flight chain) and enforces a minimum gap between them,
// so an adapter never hammers a source. Personal-use, respectful-access.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// One promise chain per host keeps requests serialized; lastRun tracks the
// completion time so the next request waits out the remaining gap.
const chains = new Map<string, Promise<unknown>>();
const lastRun = new Map<string, number>();

/**
 * Run `fn` for `host` no sooner than `gapMs` after the previous run for that
 * host, with only one request in flight per host at a time. Failures do not
 * stall the chain — the next queued call still runs.
 */
export function rateLimited<T>(host: string, gapMs: number, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(host) ?? Promise.resolve();
  const next = prev.then(async () => {
    const last = lastRun.get(host) ?? 0;
    const wait = last + gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    try {
      return await fn();
    } finally {
      lastRun.set(host, Date.now());
    }
  });
  // Keep the chain alive even if this call rejects.
  chains.set(
    host,
    next.then(
      () => undefined,
      () => undefined
    )
  );
  return next;
}

/** Test/seam helper — clears pacing state. */
export function _resetRateLimiter(): void {
  chains.clear();
  lastRun.clear();
}
