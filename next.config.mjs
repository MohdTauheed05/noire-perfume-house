/** @type {import('next').NextConfig} */
export default {
  eslint: { ignoreDuringBuilds: false },
  // Product photos may come from Firebase Storage (admin uploads) or from /public/products (committed to git).
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Frame-Options", value: "DENY" }, { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ] }];
  },
};
