import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";

import { SiteFooter } from "@/components/layout/site-footer";
import { brand } from "@/lib/copy";
import {
  getAllBlogPosts,
  getBlogPost,
  listBlogSlugs,
} from "@/lib/blog";

// Statically prerender every post at build time. Add a new .md file in
// content/blog and a fresh deploy will pick it up — no code changes needed.
export function generateStaticParams() {
  return listBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Not found — HantaVirusTrack" };
  const canonical = `https://${brand.domain}/blog/${post.slug}`;
  return {
    title: `${post.title} — HantaVirusTrack`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      title:       post.title,
      description: post.description,
      type:        "article",
      url:         canonical,
      siteName:    "HantaVirusTrack",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors:     post.author ? [post.author] : undefined,
    },
    twitter: {
      card:        "summary_large_image",
      title:       post.title,
      description: post.description,
    },
  };
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const all = getAllBlogPosts();
  const others = all.filter((p) => p.slug !== post.slug).slice(0, 4);

  const dateLabel = (() => {
    try { return format(parseISO(post.date), "MMM d, yyyy"); }
    catch { return post.date; }
  })();

  // JSON-LD Article schema. Google uses this for rich snippets — it's the
  // single highest-leverage post-write SEO win for a new blog.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "Article",
    headline:    post.title,
    description: post.description,
    datePublished: post.date,
    dateModified:  post.updated ?? post.date,
    author: post.author
      ? { "@type": "Organization", name: post.author }
      : { "@type": "Organization", name: "HantaVirusTrack" },
    publisher: {
      "@type": "Organization",
      name:    "HantaVirusTrack",
      url:     `https://${brand.domain}`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id":   `https://${brand.domain}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
  };

  return (
    <>
      <article
        className="mx-auto w-full px-5 py-10 md:px-16 md:py-16"
        style={{ maxWidth: 760 }}
      >
        <Link
          href="/blog"
          style={{ fontSize: 12, color: "var(--text-tertiary)" }}
        >
          ← All posts
        </Link>

        <header style={{ margin: "16px 0 32px" }}>
          {post.category && (
            <div
              className="t-cap t-up"
              style={{ color: "var(--accent)", fontWeight: 600, marginBottom: 8 }}
            >
              {post.category}
            </div>
          )}
          <h1
            className="t-display"
            style={{ margin: "0 0 12px", color: "var(--text-primary)" }}
          >
            {post.title}
          </h1>
          <p
            style={{
              fontSize:   15,
              lineHeight: "24px",
              color:      "var(--text-secondary)",
              margin:     "0 0 16px",
            }}
          >
            {post.description}
          </p>
          <div
            className="flex items-center"
            style={{ gap: 12, fontSize: 12, color: "var(--text-tertiary)" }}
          >
            <span>{post.author ?? "HantaVirusTrack Editorial"}</span>
            <span>·</span>
            <time dateTime={post.date} className="t-mono">{dateLabel}</time>
          </div>
        </header>

        <div
          className="blog-prose"
          // Markdown → HTML at build time via marked. Content is from .md
          // files we author and ship in the repo, never user input — so the
          // dangerous-html injection vector is the same as a hand-written
          // <p>: anything that ends up here, we put there.
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {others.length > 0 && (
          <section
            style={{
              marginTop:   48,
              paddingTop:  24,
              borderTop:   "1px solid var(--border-subtle)",
            }}
          >
            <h2 className="t-cap t-up" style={{ color: "var(--text-secondary)", marginBottom: 14 }}>
              Read more
            </h2>
            <ul className="flex flex-col" style={{ gap: 12 }}>
              {others.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    style={{
                      fontSize:    14,
                      fontWeight:  500,
                      color:       "var(--text-primary)",
                    }}
                  >
                    {p.title}
                  </Link>
                  <p
                    style={{
                      fontSize:    12,
                      lineHeight:  "18px",
                      margin:      "2px 0 0",
                      color:       "var(--text-secondary)",
                    }}
                  >
                    {p.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <script
        type="application/ld+json"
        // Schema.org JSON-LD. Inline so search engines see it during the
        // initial document parse rather than after hydration.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteFooter />
    </>
  );
}
