/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  optimizeFonts: false,
  experimental: {
    ssr: true
  },
  // Wyłącz prerendering dla stron dynamicznych
  trailingSlash: true,
  // Konfiguracja dla Firebase Hosting
  async rewrites() {
    return [
      {
        source: '/login',
        destination: '/login',
      },
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ];
  },
}

module.exports = nextConfig
