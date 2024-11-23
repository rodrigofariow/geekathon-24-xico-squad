/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BASIC_AUTH_USER: process.env.BASIC_AUTH_USER,
    BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
  },
};

module.exports = nextConfig;
