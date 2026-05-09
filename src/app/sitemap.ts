import type { MetadataRoute } from "next";

import { brand } from "@/lib/copy";
import { getAllBlogPosts } from "@/lib/blog";

// =============================================================================
// Sitemap — Next 16 file-based convention. Generates /sitemap.xml at build
// time. Submit to Google Search Console once after the first deploy; the
// crawler picks up later additions automatically because every new blog
// post lands in the same listing.
// =============================================================================

const BASE = `https://${brand.domain}`;

const STATIC_PATHS = [
  "/",
  "/map",
  "/cases",
  "/symptoms",
  "/blog",
  "/sources",
  "/about",
  "/support",
  "/legal/disclaimer",
  "/legal/terms",
  "/legal/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url:        `${BASE}${p}`,
    lastModified: now,
    changeFrequency: p === "/" || p === "/map" || p === "/cases" ? "hourly" : "weekly",
    priority:   p === "/" ? 1.0 : p === "/map" || p === "/cases" ? 0.9 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = getAllBlogPosts().map((post) => ({
    url:           `${BASE}/blog/${post.slug}`,
    lastModified:  new Date(post.updated ?? post.date),
    changeFrequency: "monthly",
    priority:      0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
