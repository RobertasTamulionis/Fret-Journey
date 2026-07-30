import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 // lets you write @use "variables" instead of long relative paths
  sassOptions: { includePaths: ["./src/lib/styles"] },
};

export default nextConfig;
