/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Nur das Nötigste – App Router in src/app/ wird automatisch erkannt
  // (wenn nicht → morgen testen wir src/-Support)

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Security-Headers (optional, aber nett)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;