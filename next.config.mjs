/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: [process.env.AUTH_URL],
    productionBrowserSourceMaps: false,
    async rewrites() {
        return [
            {
                source: '/components/discordapp/_next/:path*',
                destination: '/_next/:path*',
            },
            {
                source: '/components/discordapp/_next/image',
                destination: '/_next/image',
            },
            {
                source: '/components/discordapp/__nextjs_font/:path*',
                destination: '/__nextjs_font/:path*',
            },
            {
                source: '/components/discordapp/api/auth/:path*',
                destination: '/api/auth/:path*',
            },
            {
                source: '/components/discordapp/:path*',
                destination: '/:path*',
            },
        ];
    },
};

export default nextConfig;
