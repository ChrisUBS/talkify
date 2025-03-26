import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        domains: [
            'lh3.googleusercontent.com',  // Dominio de imágenes de perfil de Google
        ]
    },
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    }
};

export default nextConfig;
