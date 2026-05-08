import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: "/GeoHealthTracker",
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow LAN dev access (phone hitting the Mac's local IP). Next 16 blocks
  // cross-origin requests to dev chunks by default. Only honoured in
  // development; production deploys are unaffected. If your Mac's IP
  // changes (DHCP), add the new one here and restart the dev server.
  allowedDevOrigins: ["10.0.0.61"],
};

export default nextConfig;
