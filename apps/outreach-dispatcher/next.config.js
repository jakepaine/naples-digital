/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
  },
};
module.exports = nextConfig;
