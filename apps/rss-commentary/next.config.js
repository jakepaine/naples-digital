/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@naples/ui", "@naples/db", "@naples/outreach"],
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
  },
};
module.exports = nextConfig;
