/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@naples/ui", "@naples/mock-data"],
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
  },
};
module.exports = nextConfig;
