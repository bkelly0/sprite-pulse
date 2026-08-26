/** @type {import('next').NextConfig} */
const goBackendUrl =
  process.env.NEXT_GO_PRIVATE_BACKEND_URL ??
  process.env.NEXT_PUBLIC_GO_BACKEND_URL ??
  "http://localhost:8080";

const enableProxy =
  process.env.NEXT_ENABLE_PROXY ??
  process.env.NEXT_PUBLIC_ENABLE_PROXY ??
  "false";

const nextConfig = {
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  env: {
    NEXT_ENABLE_PROXY: enableProxy,
    NEXT_PUBLIC_ENABLE_PROXY: enableProxy,
    NEXT_GO_PRIVATE_BACKEND_URL: goBackendUrl,
    NEXT_PUBLIC_GO_BACKEND_URL: goBackendUrl,
  },
  async rewrites() {
    return [
      { source: "/about", destination: "/" },
      { source: "/particles", destination: "/" },
      { source: "/sprite-sheets", destination: "/" },
      { source: "/scrolling", destination: "/" },
      { source: "/vector-shapes", destination: "/" },
      { source: "/benchmark", destination: "/" },
      { source: "/concurrency", destination: "/" },
      { source: "/backend-state", destination: "/" },
    ];
  },
};

export default nextConfig;
