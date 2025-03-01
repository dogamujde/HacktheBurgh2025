import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Configure paths to the scraped data
  env: {
    NEXT_PUBLIC_DATA_DIR: '../scraped_data',
  },
};

export default nextConfig;
