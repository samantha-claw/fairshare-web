/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
      reactStrictMode: true,
        images: {
                remotePatterns: [
                          { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
                ],
                    unoptimized: false,
        },
};

export default withNextIntl(nextConfig);
