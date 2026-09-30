function mediaRemotePatterns() {
  const hosts = new Set();
  const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST;
  const api = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  const supabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://bdmihntpuyiuhtrkllil.supabase.co";

  if (mediaHost) hosts.add(mediaHost);
  if (api) {
    try {
      hosts.add(new URL(api).hostname);
    } catch {
      // Ignore invalid API URLs during config parse.
    }
  }
  if (supabase) {
    try {
      hosts.add(new URL(supabase).hostname);
    } catch {
      // Ignore invalid Supabase URLs during config parse.
    }
  }

  const patterns = [...hosts].map((hostname) => ({
    protocol: hostname === "localhost" ? "http" : "https",
    hostname,
    pathname: "/**",
  }));

  patterns.push({
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  });

  return patterns;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 90, 95, 100],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    remotePatterns: mediaRemotePatterns(),
  },
};

export default nextConfig;
