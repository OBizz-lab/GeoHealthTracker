import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

// =============================================================================
// Blog content loader. Reads markdown files from /content/blog at build time
// and turns them into typed BlogPost objects. Used by /blog (listing) and
// /blog/[slug] (detail). Pure server-side — never imported from a Client
// Component, so the `node:fs` import doesn't ship to the browser.
// =============================================================================

export interface BlogPost {
  slug:        string;
  title:       string;
  description: string;
  date:        string; // ISO date or YYYY-MM-DD
  updated?:    string;
  category?:   string;
  keywords:    string[];
  author?:     string;
  /** Rendered HTML body (marked output). */
  html:        string;
  /** First non-frontmatter sentence-ish chunk; falls back to description. */
  excerpt:     string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function listSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function loadPost(slug: string): BlogPost | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const fmSlug = typeof data.slug === "string" ? data.slug : slug;
  if (fmSlug !== slug) {
    // Don't blow up the build for one mismatched file — log + use the file's slug.
    console.warn(`[blog] frontmatter slug "${fmSlug}" differs from filename "${slug}"; using filename`);
  }

  const html = marked.parse(content, { async: false }) as string;

  const dateRaw = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? "");
  const updatedRaw = data.updated instanceof Date
    ? data.updated.toISOString().slice(0, 10)
    : data.updated ? String(data.updated) : undefined;

  // Pull the first paragraph for the listing excerpt; strip headings.
  const firstParagraph =
    content
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#")) ?? "";

  return {
    slug,
    title:       String(data.title ?? slug),
    description: String(data.description ?? ""),
    date:        dateRaw,
    updated:     updatedRaw,
    category:    data.category ? String(data.category) : undefined,
    keywords:    Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    author:      data.author ? String(data.author) : undefined,
    html,
    excerpt:     firstParagraph || String(data.description ?? ""),
  };
}

/** All published posts, sorted by date desc (newest first). */
export function getAllBlogPosts(): BlogPost[] {
  return listSlugs()
    .map(loadPost)
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPost(slug: string): BlogPost | null {
  return loadPost(slug);
}

export function listBlogSlugs(): string[] {
  return listSlugs();
}
