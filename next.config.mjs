/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "armaf.com" },
      { protocol: "https", hostname: "www.lattafa-usa.com" },
      { protocol: "https", hostname: "lattafa-usa.com" },
      { protocol: "https", hostname: "intimamentebella.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

export default nextConfig;
