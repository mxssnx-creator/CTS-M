import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Do not try to bundle Node.js built-ins for the browser
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: false,
        stream: false,
        buffer: false,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
      }
    }
    return config
  },
};

export default nextConfig;
