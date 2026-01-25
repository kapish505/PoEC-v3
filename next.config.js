/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Ensure we don't try to use static export unless explicitly requested
    output: 'export',
}

module.exports = nextConfig
