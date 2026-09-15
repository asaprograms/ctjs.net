/** @type {import('next').NextConfig} */
export default {
  experimental: {
    serverComponentsExternalPackages: ["@discordjs"],
  },
  webpack: config => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });
    return config;
  },
};
