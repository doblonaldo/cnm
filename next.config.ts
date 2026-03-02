import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["ssh2", "net-snmp", "mysql2"],
};
export default nextConfig;
