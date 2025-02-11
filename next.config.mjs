const nextConfig = {
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL
        ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
        : "",
      new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname,
    ],
  },
};

export default nextConfig;
