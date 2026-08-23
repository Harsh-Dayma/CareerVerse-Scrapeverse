/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "pg", "pdf-parse", "mammoth"],
  },
};

module.exports = nextConfig;
