/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "uygvozrdqprokqgapgnx.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "ramajewels.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/placeholder.jpg",
        destination: "/placeholder.svg",
      },
    ];
  },
};

export default nextConfig;
