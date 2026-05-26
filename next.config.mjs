/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['canvas', 'jspdf', 'jspdf-autotable'],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
