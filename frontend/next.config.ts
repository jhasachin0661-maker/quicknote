import type { NextConfig } from "next";

const repoBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: repoBasePath && repoBasePath !== '/' ? repoBasePath : undefined,
  trailingSlash: true,
};

export default nextConfig;
