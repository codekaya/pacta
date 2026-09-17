import type { NextConfig } from 'next';

const config: NextConfig = {
  // anchor/src has no Node-only APIs; the clinic desk will import it directly.
  transpilePackages: ['@pacta/anchor'],
  agentRules: false,
};

export default config;
