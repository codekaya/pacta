import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// Repo root, so Turbopack can follow the ../anchor workspace link.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const config: NextConfig = {
  // anchor/src has no Node-only APIs beyond fetch; the clinic desk imports it directly.
  transpilePackages: ['@pacta/anchor'],
  turbopack: { root },
  outputFileTracingRoot: root,
  agentRules: false,
};

export default config;
