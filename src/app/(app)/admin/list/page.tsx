"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";

import {
  readStoredSession,
  fetchIsApprovedAdmin,
  fetchAdminList,
  type AdminListRow,
} from "@/lib/auth/session";

// =============================================================================
// /admin/list — admins-only directory of every approved admin and their
// per-status submission counts. Backed by the admin_list_stats Postgres
// view (security_invoker = on, so non-admins get nothing).
// =============================================================================

export default function AdminListPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [rows, setRows]         = useState<AdminListRow[]>([]);
  const [error, setError]       = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = readStoredSession();
      if (!session) {
        if (!cancelled) router.replace("/admin/sign-in");
        return;
      }
      const isAdmin = await fetchIsApprovedAdmin(session);
      if (cancelled) return;
      if (!isAdmin) {
        router.replace("/admin/pending");
        return;
      }
      const list = await fetchAdminList(session);
      if (cancelled) return;
      if (list.length === 0) setError("No data returned. The view may not be set up.");
      setRows(list);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (!hydrated) return null;

  return (
    <main className="mx-auto w-full px-5 py-10 md:px-16 md:py-16" style={{ maxWidth: 880 }}>
      <Link
        href="/admin/queue"
        style={{ fontSize: 12, color: "var(--text-tertiary)" }}
      >
        ← Back to moderation queue
      </Link>

      <div className="mt-3 flex items-center" style={{ gap: 8 }}>
        <Users className="h-4 w-4" style={{ color: "var(--accent)" }} />
        <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          Admin list
        </span>
      </div>
      <h1
        className="t-display"
        style={{ margin: "8px 0 8px", color: "var(--text-primary)" }}
      >
        All admins · submission stats
      </h1>
      <p
        style={{
          fontSize:    14,
          lineHeight:  "22px",
          maxWidth:    640,
          color:       "var(--text-secondary)",
          marginBottom: 24,
        }}
      >
        Every approved admin and a count of cases they&apos;ve submitted.
        <strong style={{ color: "var(--status-recovered)" }}> Accepted</strong> = published to the public map.
        <strong style={{ color: "var(--accent)" }}> Pending</strong> = waiting for another admin to approve.
        <strong style={{ color: "var(--status-fatal)" }}> Rejected</strong> = soft-deleted; doesn&apos;t appear publicly.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding:      "10px 12px",
            borderRadius: 8,
            background:   "rgba(201,42,79,0.08)",
            border:       "1px solid rgba(201,42,79,0.30)",
            fontSize:     13,
            color:        "var(--status-fatal)",
          }}
        >
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div
          style={{
            padding:      80,
            border:       "1px dashed var(--border-default)",
            borderRadius: 12,
            textAlign:    "center",
            color:        "var(--text-tertiary)",
          }}
        >
          No admins yet.
        </div>
      ) : (
        <>
          {/* ── Mobile: stacked card per admin ───────────────────────── */}
          <ul className="flex flex-col md:hidden" style={{ gap: 10 }}>
            {rows.map((r) => {
              const grantedDate = (() => {
                try { return new Date(r.granted_at).toLocaleDateString(); }
                catch { return r.granted_at; }
              })();
              return (
                <li
                  key={r.user_id}
                  style={{
                    background:   "var(--bg-surface)",
                    border:       "1px solid var(--border-default)",
                    borderRadius: 10,
                    padding:      14,
                  }}
                >
                  <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
                    <ShieldCheck
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--status-recovered)" }}
                    />
                    <div className="flex flex-col" style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize:    14,
                          fontWeight:  500,
                          color:       "var(--text-primary)",
                          overflow:    "hidden",
                          textOverflow:"ellipsis",
                          whiteSpace:  "nowrap",
                        }}
                      >
                        {r.username ?? r.user_id.slice(0, 8) + "…"}
                      </span>
                      <span
                        className="t-mono"
                        style={{ fontSize: 11, color: "var(--text-tertiary)" }}
                      >
                        Granted {grantedDate}
                      </span>
                    </div>
                  </div>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap:        8,
                      marginTop:  12,
                    }}
                  >
                    <Chip label="Accepted" value={r.accepted_count} color="var(--status-recovered)" />
                    <Chip label="Pending"  value={r.pending_count}  color="var(--accent)" />
                    <Chip label="Rejected" value={r.rejected_count} color="var(--status-fatal)" />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ── Desktop: table ──────────────────────────────────────── */}
          <div
            className="hidden md:block"
            style={{
              background:   "var(--bg-surface)",
              border:       "1px solid var(--border-default)",
              borderRadius: 8,
              overflow:     "hidden",
            }}
          >
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "minmax(0, 2fr) 110px 80px 80px 80px",
                padding:        "12px 16px",
                background:     "var(--bg-overlay)",
                borderBottom:   "1px solid var(--border-subtle)",
                gap:            12,
              }}
            >
              {["Admin", "Granted", "Accepted", "Pending", "Rejected"].map((h, i) => (
                <div
                  key={h}
                  className="t-cap t-up"
                  style={{
                    color:     "var(--text-secondary)",
                    textAlign: i >= 2 ? "right" : "left",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {rows.map((r) => {
              const grantedDate = (() => {
                try { return new Date(r.granted_at).toLocaleDateString(); }
                catch { return r.granted_at; }
              })();
              return (
                <div
                  key={r.user_id}
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: "minmax(0, 2fr) 110px 80px 80px 80px",
                    padding:      "14px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                    gap:          12,
                  }}
                >
                  <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
                    <ShieldCheck
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--status-recovered)" }}
                    />
                    <div className="flex flex-col" style={{ minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.username ?? r.user_id.slice(0, 8) + "…"}
                      </span>
                      {!r.username && (
                        <span
                          className="t-cap"
                          style={{ color: "var(--text-tertiary)", fontSize: 10 }}
                        >
                          No signup record
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="t-mono"
                    style={{ fontSize: 11, color: "var(--text-secondary)" }}
                  >
                    {grantedDate}
                  </span>
                  <CountCell value={r.accepted_count} color="var(--status-recovered)" />
                  <CountCell value={r.pending_count}  color="var(--accent)" />
                  <CountCell value={r.rejected_count} color="var(--status-fatal)" />
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

function CountCell({ value, color }: { value: number; color: string }) {
  return (
    <span
      className="num"
      style={{
        fontSize:   13,
        fontWeight: 600,
        textAlign:  "right",
        color:      value === 0 ? "var(--text-tertiary)" : color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  );
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  const dim = value === 0;
  return (
    <div
      style={{
        background:   "var(--bg-base)",
        border:       "1px solid var(--border-subtle)",
        borderRadius: 8,
        padding:      "8px 10px",
        textAlign:    "center",
      }}
    >
      <div
        className="num"
        style={{
          fontSize:   18,
          fontWeight: 600,
          color:      dim ? "var(--text-tertiary)" : color,
          fontVariantNumeric: "tabular-nums",
          lineHeight: "22px",
        }}
      >
        {value}
      </div>
      <div
        className="t-cap t-up"
        style={{ color: "var(--text-tertiary)", fontSize: 10, marginTop: 2 }}
      >
        {label}
      </div>
    </div>
  );
}
