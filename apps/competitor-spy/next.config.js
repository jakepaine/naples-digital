/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@naples/ui", "@naples/db"],
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};
module.exports = nextConfig;
