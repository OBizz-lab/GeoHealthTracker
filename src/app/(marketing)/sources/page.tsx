import { ChevronRight } from "lucide-react";

import { SiteFooter }                from "@/components/layout/site-footer";
import { sourcesPage }               from "@/lib/copy";
import { fetchSourcesHealth }        from "@/lib/supabase/sources";

export const metadata = {
  title: "Sources — HantaVirusTrack",
  description: sourcesPage.intro,
};

export default async function SourcesPage() {
  const sources = await fetchSourcesHealth();

  return (
    <>
      <section
        className="mx-auto w-full px-5 py-10 md:px-16 md:py-16"
        style={{ maxWidth: 1200 }}
      >
        <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          {sourcesPage.eyebrow}
        </div>
        <h1
          className="t-display"
          style={{ margin: "12px 0 16px", color: "var(--text-primary)" }}
        >
          {sourcesPage.title}
        </h1>
        <p
          style={{
            fontSize:    15,
            lineHeight:  "24px",
            maxWidth:    700,
            marginBottom: 40,
            color:       "var(--text-secondary)",
          }}
        >
          {sourcesPage.intro}
        </p>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Sources table */}
          <div>
            {sources.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{
                  padding:      80,
                  border:       "1px dashed var(--border-default)",
                  borderRadius: 12,
                  gap:          12,
                }}
              >
                <div className="t-label" style={{ color: "var(--text-primary)" }}>
                  No sources configured
                </div>
                <div
                  className="t-cap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  An admin must add sources to begin ingestion.
                </div>
              </div>
            ) : (
              <>
                {/* Desktop / tablet table (md+) */}
                <div
                  className="hidden md:block"
                  style={{
                    background:   "var(--bg-surface)",
                    border:       "1px solid var(--border-default)",
                    borderRadius: 8,
                    overflow:     "hidden",
                  }}
                >
                  {/* Table header */}
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 24px",
                      padding:        "12px 16px",
                      background:     "var(--bg-overlay)",
                      borderBottom:   "1px solid var(--border-subtle)",
                    }}
                  >
                    {["Source", "Region", "Cadence", "Last success", "Status", ""].map((h) => (
                      <div
                        key={h}
                        className="t-cap t-up"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {/* Rows */}
                  {sources.map((s, i) => (
                    <div
                      key={s.slug}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 24px",
                        padding:    "14px 16px",
                        borderBottom: i < sources.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                      }}
                    >
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <span
                          className="flex items-center justify-center"
                          style={{
                            width: 20, height: 20, borderRadius: 4,
                            background: "var(--accent-muted)",
                            fontSize:   9,
                            fontWeight: 700,
                            color:      "var(--accent)",
                          }}
                        >
                          {s.slug.slice(0, 2).toUpperCase()}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                          {s.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {s.region ?? "—"}
                      </span>
                      <span className="t-mono" style={{ color: "var(--text-secondary)" }}>
                        {s.cadence ?? "—"}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {s.lastSuccess}
                      </span>
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <span className={`dot dot-${s.status}`} />
                        <span
                          style={{
                            fontSize: 12, fontWeight: 500,
                            color:    s.status === "red"
                              ? "var(--status-fatal)"
                              : s.status === "yellow"
                                ? "var(--status-suspected)"
                                : "var(--status-recovered)",
                          }}
                        >
                          {s.status === "red" ? "Degraded" : s.status === "yellow" ? "Slow" : "Healthy"}
                        </span>
                      </div>
                      <ChevronRight
                        className="h-3.5 w-3.5"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Mobile card list (< md) */}
                <ul className="flex flex-col gap-3 md:hidden">
                  {sources.map((s) => {
                    const statusLabel =
                      s.status === "red" ? "Degraded" : s.status === "yellow" ? "Slow" : "Healthy";
                    const statusColor =
                      s.status === "red"
                        ? "var(--status-fatal)"
                        : s.status === "yellow"
                          ? "var(--status-suspected)"
                          : "var(--status-recovered)";
                    return (
                      <li
                        key={s.slug}
                        style={{
                          background:   "var(--bg-surface)",
                          border:       "1px solid var(--border-default)",
                          borderRadius: 10,
                          padding:      14,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center min-w-0" style={{ gap: 8 }}>
                            <span
                              className="flex shrink-0 items-center justify-center"
                              style={{
                                width: 24, height: 24, borderRadius: 5,
                                background: "var(--accent-muted)",
                                fontSize:   10,
                                fontWeight: 700,
                                color:      "var(--accent)",
                              }}
                            >
                              {s.slug.slice(0, 2).toUpperCase()}
                            </span>
                            <span
                              className="truncate"
                              style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}
                            >
                              {s.name}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center" style={{ gap: 6 }}>
                            <span className={`dot dot-${s.status}`} />
                            <span
                              style={{ fontSize: 12, fontWeight: 500, color: statusColor }}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        </div>

                        <dl
                          className="mt-3 grid"
                          style={{
                            gridTemplateColumns: "auto 1fr",
                            columnGap: 12,
                            rowGap:    6,
                          }}
                        >
                          <dt className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
                            Region
                          </dt>
                          <dd style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            {s.region ?? "—"}
                          </dd>
                          <dt className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
                            Cadence
                          </dt>
                          <dd className="t-mono" style={{ color: "var(--text-secondary)" }}>
                            {s.cadence ?? "—"}
                          </dd>
                          <dt className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
                            Last success
                          </dt>
                          <dd style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            {s.lastSuccess}
                          </dd>
                        </dl>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {/* Methodology card */}
          <div
            style={{
              background:   "var(--bg-surface)",
              border:       "1px solid var(--border-default)",
              borderRadius: 8,
              padding:      20,
              alignSelf:    "flex-start",
            }}
          >
            <div className="t-cap t-up" style={{ marginBottom: 8, color: "var(--text-secondary)" }}>
              Methodology
            </div>
            <div className="t-h3" style={{ marginBottom: 12, color: "var(--text-primary)" }}>
              {sourcesPage.methodologyHeading}
            </div>
            <div
              style={{
                fontSize:    13,
                lineHeight:  "20px",
                color:       "var(--text-secondary)",
              }}
            >
              {sourcesPage.methodologyBody}
            </div>
            <a
              href="/about"
              style={{
                fontSize:   12,
                marginTop:  12,
                display:    "inline-block",
                color:      "var(--accent)",
              }}
            >
              Read full methodology →
            </a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
