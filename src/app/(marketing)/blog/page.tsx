import Link from "next/link";
import { format, parseISO } from "date-fns";

import { SiteFooter } from "@/components/layout/site-footer";
import { getAllBlogPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog — HantaVirusTrack",
  description:
    "Plain-language guides to hantavirus: what it is, how it spreads, how long it lives, and what to actually worry about.",
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <>
      <section
        className="mx-auto w-full px-5 py-10 md:px-16 md:py-16"
        style={{ maxWidth: 880 }}
      >
        <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          Blog
        </div>
        <h1
          className="t-display"
          style={{ margin: "12px 0 16px", color: "var(--text-primary)" }}
        >
          Hantavirus, in plain language.
        </h1>
        <p
          style={{
            fontSize:    15,
            lineHeight:  "24px",
            maxWidth:    640,
            marginBottom: 32,
            color:       "var(--text-secondary)",
          }}
        >
          Short guides answering the questions people actually ask about
          hantavirus — sourced from the CDC, WHO, and peer-reviewed literature.
          No clickbait, no scaremongering.
        </p>

        {posts.length === 0 ? (
          <div
            className="text-center"
            style={{
              padding:      80,
              border:       "1px dashed var(--border-default)",
              borderRadius: 12,
              color:        "var(--text-tertiary)",
            }}
          >
            No posts yet.
          </div>
        ) : (
          <ul className="flex flex-col" style={{ gap: 0 }}>
            {posts.map((post) => {
              const dateLabel = (() => {
                try { return format(parseISO(post.date), "MMM d, yyyy"); }
                catch { return post.date; }
              })();
              return (
                <li
                  key={post.slug}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block transition-colors"
                    style={{ padding: "20px 0", color: "var(--text-primary)" }}
                  >
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                      {post.category && (
                        <span
                          className="t-cap t-up"
                          style={{
                            color:       "var(--accent)",
                            fontWeight:  600,
                            fontSize:    11,
                          }}
                        >
                          {post.category}
                        </span>
                      )}
                      <span className="t-mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                        {dateLabel}
                      </span>
                    </div>
                    <h2
                      className="t-h2"
                      style={{
                        marginBottom: 6,
                        color:        "var(--text-primary)",
                      }}
                    >
                      {post.title}
                    </h2>
                    <p
                      style={{
                        fontSize:    14,
                        lineHeight:  "22px",
                        color:       "var(--text-secondary)",
                        margin:      0,
                      }}
                    >
                      {post.description}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
