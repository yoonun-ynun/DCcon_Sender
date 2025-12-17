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
            // next/image 최적화 엔드포인트 (이거 빠지면 이미지 “안 뜨는” 느낌)
            {
                source: '/components/discordapp/_next/image',
                destination: '/_next/image',
            },
            // next font
            {
                source: '/components/discordapp/__nextjs_font/:path*',
                destination: '/__nextjs_font/:path*',
            },
            // next-auth
            {
                source: '/components/discordapp/api/auth/:path*',
                destination: '/api/auth/:path*',
            },

            // (필요하면) public 파일도 prefix로 들어오는 경우
            {
                source: '/components/discordapp/:path*',
                destination: '/:path*',
            },
        ];
    },
};

export default nextConfig;
