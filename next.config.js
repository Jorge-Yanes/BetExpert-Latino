/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true, 
    images: {
        domains: ['firebasestorage.googleapis.com'], // Agrega el dominio de Firebase Storage
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Wildcard to match any hostname
            },
        ],
    }
};

module.exports = nextConfig; // Use CommonJS syntax if needed

