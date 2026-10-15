/**
 * Fetch policy for FakeStore requests made on the server.
 * Main benchmark: no caching, every page request fetches fresh data (same as A and B,
 * which fetch from the browser on every load). Set C_DATA_CACHE=1 for the separate
 * "data cache" experiment (responses cached for 5 minutes in the Next.js data cache).
 */
export const fetchInit =
  process.env.C_DATA_CACHE === '1' ? { cache: 'force-cache', next: { revalidate: 300 } } : { cache: 'no-store' };

/**
 * Image experiment: C_NEXT_IMAGE=1 makes the C MFEs render product images with next/image
 * (resized, modern formats). The main comparison uses plain <img>, like A and B.
 * Returns the component to pass as `Img` to the shared views, or undefined (= plain <img>).
 */
export async function imageComponent() {
  if (process.env.C_NEXT_IMAGE !== '1') return undefined;
  return (await import('./NextImg.jsx')).default;
}

/**
 * Error-isolation test hook. In C every MFE runs inside one Next.js process, so an MFE
 * cannot be "switched off" like A's or B's servers. Instead C_FAIL_MFE=<home|plp|pdp|cart>
 * makes that MFE throw while rendering, to check that only its own boundary is affected.
 */
export function failIfRequested(name) {
  if (process.env.C_FAIL_MFE === name) throw new Error(`[${name}] simulated failure (C_FAIL_MFE)`);
}
