"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

import { SiteFooter }            from "@/components/layout/site-footer";
import { fetchPublishedCases }   from "@/lib/supabase/cases";
import { getSupabaseClient }     from "@/lib/supabase/client";
import { pillClass, statusLabels } from "@/lib/design-tokens";
import type { Report }           from "@/lib/types";

// =============================================================================
// Cases list — sortable / filterable table view of the same DB rows
// =============================================================================

export default function CasesListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [submittedFlash, setSubmittedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedCases()
      .then((rs) => { if (!cancelled) setReports(rs); })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Admin-grant check — show the + button only to APPROVED admins, not
  // anyone with a session. A pending-but-not-approved user should not see
  // the contribute UI yet (RLS would block them anyway).
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    async function refresh() {
      const { data: sess } = await supabase!.auth.getSession();
      if (!sess.session) { if (!cancelled) setIsAdmin(false); return; }
      const { data: grant } = await supabase!
        .from("admin_grants")
        .select("user_id")
        .eq("user_id", sess.session.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!grant);
    }
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(refresh);
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // One-shot toast when redirected back from /admin/submit?submitted=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("submitted") === "1") {
      setSubmittedFlash(true);
      url.searchParams.delete("submitted");
      window.history.replaceState({}, "", url.toString());
      const t = setTimeout(() => setSubmittedFlash(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...reports]
      .sort((a, b) => new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime())
      .filter((r) => {
        if (!q) return true;
        return (
          r.location_name.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.source_name.toLowerCase().includes(q)
        );
      });
  }, [reports, search]);

  return (
    <>
      <section
        className="mx-auto w-full px-5 py-10 md:px-16 md:py-16"
        style={{ maxWidth: 1200 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Cases
            </div>
            <h1
              className="t-display"
              style={{ margin: "12px 0 16px", color: "var(--text-primary)" }}
            >
              All published cases.
            </h1>
          </div>
          {isAdmin && (
            <Link
              href="/admin/submit"
              aria-label="Submit a new case"
              className="inline-flex shrink-0 items-center gap-1.5 transition-colors"
              style={{
                marginTop:    14,
                padding:      "8px 12px",
                fontSize:     13,
                fontWeight:   600,
                borderRadius: 8,
                background:   "var(--accent)",
                color:        "var(--text-inverse)",
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add case
            </Link>
          )}
        </div>

        {submittedFlash && (
          <div
            role="status"
            style={{
              marginBottom: 24,
              padding:      "12px 14px",
              borderRadius: 10,
              fontSize:     13,
              background:   "rgba(91,192,235,0.10)",
              border:       "1px solid rgba(91,192,235,0.35)",
              color:        "var(--text-primary)",
            }}
          >
            Submitted for review. Another admin must approve before it appears on the public map.
          </div>
        )}
        <p
          style={{
            fontSize:    15,
            lineHeight:  "24px",
            maxWidth:    700,
            marginBottom: 32,
            color:       "var(--text-secondary)",
          }}
        >
          Every case here has a citation back to its source. Click any row to
          jump to the case on the live map.
        </p>

        {/* Search */}
        <div
          className="flex items-center"
          style={{
            gap:          8,
            background:   "var(--bg-surface)",
            border:       "1px solid var(--border-default)",
            borderRadius: 8,
            padding:      "9px 12px",
            maxWidth:     480,
            marginBottom: 24,
          }}
        >
          <Search className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location, country, source, or notes…"
            style={{
              flex:       1,
              background: "transparent",
              border:     "none",
              outline:    "none",
              fontSize:   13,
              color:      "var(--text-primary)",
            }}
          />
        </div>

        {/* Table / list */}
        {loading ? (
          <div className="flex flex-col" style={{ gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skel" style={{ height: 56 }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="text-center"
            style={{
              padding:      80,
              border:       "1px dashed var(--border-default)",
              borderRadius: 12,
              color:        "var(--text-tertiary)",
            }}
          >
            No cases match your filters.
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
              {/* Header */}
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: "minmax(0,2fr) 110px 100px 120px 80px 32px",
                  padding:        "12px 16px",
                  background:     "var(--bg-overlay)",
                  borderBottom:   "1px solid var(--border-subtle)",
                  gap:            12,
                }}
              >
                {["Location", "Status", "Cases", "Source", "Date", ""].map((h) => (
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
              {sorted.map((r) => {
                const date = (() => {
                  try { return format(parseISO(r.reported_date), "MMM d, yyyy"); }
                  catch { return r.reported_date; }
                })();
                return (
                  <Link
                    key={r.id}
                    href={`/map?case=${encodeURIComponent(r.id)}`}
                    className="grid items-center transition-colors"
                    style={{
                      gridTemplateColumns: "minmax(0,2fr) 110px 100px 120px 80px 32px",
                      padding:    "14px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      color:      "var(--text-primary)",
                      gap:        12,
                    }}
                  >
                    <div className="flex flex-col" style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.location_name}
                      </span>
                      {r.country && r.country !== "ZZ" && (
                        <span className="t-cap" style={{ color: "var(--text-secondary)" }}>
                          {r.state_province ? `${r.state_province}, ${r.country}` : r.country}
                        </span>
                      )}
                    </div>

                    <span className={`pill ${pillClass(r.status)}`} style={{ alignSelf: "center" }}>
                      {statusLabels[r.status]}
                    </span>

                    <span
                      className="num"
                      style={{ fontSize: 13, color: "var(--text-secondary)" }}
                    >
                      {r.case_count.toLocaleString()}
                    </span>

                    <span
                      style={{
                        fontSize:    12,
                        color:       "var(--text-secondary)",
                        overflow:    "hidden",
                        textOverflow:"ellipsis",
                        whiteSpace:  "nowrap",
                      }}
                    >
                      {r.source_name}
                    </span>

                    <span
                      className="t-mono"
                      style={{ color: "var(--text-secondary)", fontSize: 11 }}
                    >
                      {date}
                    </span>

                    <ExternalLink
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Mobile card list (< md) */}
            <ul className="flex flex-col gap-3 md:hidden">
              {sorted.map((r) => {
                const date = (() => {
                  try { return format(parseISO(r.reported_date), "MMM d, yyyy"); }
                  catch { return r.reported_date; }
                })();
                const subLocation =
                  r.country && r.country !== "ZZ"
                    ? r.state_province
                      ? `${r.state_province}, ${r.country}`
                      : r.country
                    : null;
                return (
                  <li key={r.id}>
                    <Link
                      href={`/map?case=${encodeURIComponent(r.id)}`}
                      className="block transition-colors"
                      style={{
                        background:   "var(--bg-surface)",
                        border:       "1px solid var(--border-default)",
                        borderRadius: 10,
                        padding:      14,
                        color:        "var(--text-primary)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <span
                            className="truncate"
                            style={{ fontSize: 14, fontWeight: 500 }}
                          >
                            {r.location_name}
                          </span>
                          {subLocation && (
                            <span
                              className="t-cap truncate"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {subLocation}
                            </span>
                          )}
                        </div>
                        <span
                          className={`pill ${pillClass(r.status)} shrink-0`}
                        >
                          {statusLabels[r.status]}
                        </span>
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
                          Cases
                        </dt>
                        <dd className="num" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          {r.case_count.toLocaleString()}
                        </dd>
                        <dt className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
                          Source
                        </dt>
                        <dd
                          className="truncate"
                          style={{ fontSize: 13, color: "var(--text-secondary)" }}
                        >
                          {r.source_name}
                        </dd>
                        <dt className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
                          Date
                        </dt>
                        <dd className="t-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {date}
                        </dd>
                      </dl>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
