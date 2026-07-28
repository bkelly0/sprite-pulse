/** @type {import('next').NextConfig} */
const goBackendUrl =
  process.env.GO_BACKEND_URL ??
  process.env.NEXT_PUBLIC_GO_BACKEND_URL ??
  "http://localhost:8080";

const nextConfig = {
  experimental: {
    optimizePackageImports: ["react", "react-dom"]
  },
  env: {
    GO_BACKEND_URL: goBackendUrl,
    NEXT_PUBLIC_GO_BACKEND_URL: goBackendUrl
  }
};

export default nextConfig;