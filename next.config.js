/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true, 
    images: {
        domains: [
            'firebasestorage.googleapis.com', // Existing domain (optional)
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // Wildcard to match any hostname
                port: '', // Optional: specify port if needed
                pathname: '**', // Wildcard to match any path
            },
            {
                protocol: 'http',
                hostname: '**', // Allow HTTP as well
                port: '', // Optional: specify port if needed
                pathname: '**', // Wildcard to match any path
            },
        ],
    }
};

module.exports = nextConfig; // Use CommonJS syntax if needed
