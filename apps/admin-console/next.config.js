/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@naples/ui"],
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
  },
};
module.exports = nextConfig;
