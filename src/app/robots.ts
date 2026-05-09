import type { MetadataRoute } from "next";

import { brand } from "@/lib/copy";

export default function robots(): MetadataRoute.Robots {
  const base = `https://${brand.domain}`;
  return {
    rules: [
      {
        userAgent: "*",
        allow:     ["/"],
        // Admin surfaces aren't useful for search engines and shouldn't be
        // indexed (auth-gated client-side anyway, but no reason to advertise).
        disallow:  ["/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host:    base,
  };
}
