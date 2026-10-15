import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const API_URL = process.env.API_URL || 'http://localhost:3300';
const api = new URL(API_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The MFE packages and @mfe/shared are plain JSX workspace packages compiled by Next.js.
  transpilePackages: ['@mfe/shared', 'c-common', 'c-home', 'c-plp', 'c-pdp', 'c-cart'],
  // Same catalogue API as A and B (inlined so the browser checkout call can use it too).
  env: { API_URL },
  // Only used by the next/image experiment (C_NEXT_IMAGE=1): allow optimising the catalogue's images.
  images: {
    remotePatterns: [{ protocol: api.protocol.replace(':', ''), hostname: api.hostname, port: api.port, pathname: '/img/**' }],
  },
  poweredByHeader: false,
  compress: true, // gzip, same as tools/static-server.js for A and B
  outputFileTracingRoot: root, // monorepo root, needed for deployment
};

export default nextConfig;
