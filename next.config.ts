import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },
  // Removendo o warning de cross-origin na rede local usando next.js 16
  experimental: {
    // @ts-ignore - Propriedade nova do Next 16 para evitar warning Cross-origin na LAN
    allowedDevOrigins: ["*"]
  }
};

export default nextConfig;
