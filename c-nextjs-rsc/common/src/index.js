/**
 * Fetch policy for FakeStore requests made on the server.
 * Main benchmark: no caching, every page request fetches fresh data (same as A and B,
 * which fetch from the browser on every load). Set C_DATA_CACHE=1 for the separate
 * "data cache" experiment (responses cached for 5 minutes in the Next.js data cache).
 */
export const fetchInit =
  process.env.C_DATA_CACHE === '1' ? { cache: 'force-cache', next: { revalidate: 300 } } : { cache: 'no-store' };

/**
 * Error-isolation test hook. In C every MFE runs inside one Next.js process, so an MFE
 * cannot be "switched off" like A's or B's servers. Instead C_FAIL_MFE=<home|plp|pdp|cart>
 * makes that MFE throw while rendering, to check that only its own boundary is affected.
 */
export function failIfRequested(name) {
  if (process.env.C_FAIL_MFE === name) throw new Error(`[${name}] simulated failure (C_FAIL_MFE)`);
}
