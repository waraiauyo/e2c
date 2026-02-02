import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: "standalone" /** Test pour Docker */,
};

export default nextConfig;
