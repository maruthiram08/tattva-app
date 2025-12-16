/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for production
  swcMinify: true,
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_APP_NAME: 'Tattva',
  },
}

module.exports = nextConfig
