"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, ShieldCheck } from "lucide-react";

import { getSupabaseClientStrict } from "@/lib/supabase/client";

interface PendingSignup {
  id:                     string;
  user_id:                string;
  username:               string;
  contribution_statement: string;
  status:                 "pending" | "approved" | "rejected";
  reviewer_note:          string | null;
  created_at:             string;
}

export default function AdminGrantsPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [signups, setSignups]   = useState<PendingSignup[]>([]);
  const [filter, setFilter]     = useState<"pending" | "all">("pending");
  const [actionError, setActionError] = useState("");

  // Auth + admin gate.
  useEffect(() => {
    const supabase = getSupabaseClientStrict();
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (!cancelled) router.replace("/admin/sign-in");
        return;
      }
      const { data: grant } = await supabase
        .from("admin_grants")
        .select("user_id")
        .eq("user_id", sess.session.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (cancelled) return;
      if (!grant) {
        router.replace("/admin/pending");
        return;
      }
      setIsAdmin(true);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    const supabase = getSupabaseClientStrict();
    let q = supabase
      .from("admin_signups")
      .select("id, user_id, username, contribution_statement, status, reviewer_note, created_at")
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    setSignups((data as unknown as PendingSignup[]) ?? []);
  }, [filter, isAdmin]);

  useEffect(() => { load(); }, [load]);

  async function approve(s: PendingSignup) {
    setActionError("");
    const supabase = getSupabaseClientStrict();

    const { data: sess } = await supabase.auth.getSession();
    const reviewerId = sess.session?.user.id;
    if (!reviewerId) { setActionError("Session expired."); return; }

    // Two-step: insert grant, then mark signup approved. Both go through RLS.
    const { error: grantErr } = await supabase.from("admin_grants").insert({
      user_id:    s.user_id,
      granted_by: reviewerId,
      notes:      `Approved via admin grants UI`,
    });
    if (grantErr && !/duplicate key/i.test(grantErr.message)) {
      setActionError(grantErr.message);
      return;
    }

    const { error: updErr } = await supabase
      .from("admin_signups")
      .update({
        status:        "approved",
        reviewed_by:   reviewerId,
        reviewed_at:   new Date().toISOString(),
      })
      .eq("id", s.id);
    if (updErr) { setActionError(updErr.message); return; }

    await load();
  }

  async function reject(s: PendingSignup) {
    setActionError("");
    const note = window.prompt(
      "Optional note for the applicant (visible to them on the pending page):",
      "",
    );
    if (note === null) return; // cancelled
    const supabase = getSupabaseClientStrict();

    const { data: sess } = await supabase.auth.getSession();
    const reviewerId = sess.session?.user.id;
    if (!reviewerId) { setActionError("Session expired."); return; }

    const { error: updErr } = await supabase
      .from("admin_signups")
      .update({
        status:        "rejected",
        reviewed_by:   reviewerId,
        reviewed_at:   new Date().toISOString(),
        reviewer_note: note.trim() || null,
      })
      .eq("id", s.id);
    if (updErr) { setActionError(updErr.message); return; }

    await load();
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto w-full px-5 py-10 md:px-16 md:py-16" style={{ maxWidth: 880 }}>
      <Link
        href="/admin/queue"
        style={{ fontSize: 12, color: "var(--text-tertiary)" }}
      >
        ← Back to moderation queue
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
              Admin grants
            </span>
          </div>
          <h1
            className="t-display"
            style={{ margin: "8px 0 8px", color: "var(--text-primary)" }}
          >
            Approve incoming admins
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
            Read each applicant&apos;s contribution statement carefully. Per the{" "}
            <Link href="/admin/cookbook" style={{ color: "var(--accent)" }}>
              Admin Cookbook
            </Link>
            : approve only people showing genuine, respectful intent — not
            anyone who clicked a button.
          </p>
        </div>
      </div>

      <div className="mb-5 flex" style={{ gap: 6 }}>
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding:     "6px 12px",
              fontSize:    12,
              fontWeight:  500,
              borderRadius: 8,
              background:   filter === f ? "var(--accent)" : "var(--bg-surface)",
              color:        filter === f ? "var(--text-inverse)" : "var(--text-secondary)",
              border:       "1px solid var(--border-default)",
              cursor:       "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {actionError && (
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
          {actionError}
        </div>
      )}

      {signups.length === 0 ? (
        <div
          style={{
            padding:      80,
            border:       "1px dashed var(--border-default)",
            borderRadius: 12,
            textAlign:    "center",
            color:        "var(--text-tertiary)",
          }}
        >
          No applications {filter === "pending" ? "pending review" : "yet"}.
        </div>
      ) : (
        <ul className="flex flex-col" style={{ gap: 12 }}>
          {signups.map((s) => (
            <li
              key={s.id}
              style={{
                background:   "var(--bg-surface)",
                border:       "1px solid var(--border-default)",
                borderRadius: 10,
                padding:      16,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}
                  >
                    {s.username}
                  </div>
                  <div
                    className="t-cap"
                    style={{ color: "var(--text-tertiary)", marginTop: 2 }}
                  >
                    {new Date(s.created_at).toLocaleString()} ·{" "}
                    <StatusBadge status={s.status} />
                  </div>
                </div>
                {s.status === "pending" && (
                  <div className="flex shrink-0" style={{ gap: 6 }}>
                    <button
                      onClick={() => approve(s)}
                      title="Approve this admin"
                      style={{
                        display:      "inline-flex",
                        alignItems:   "center",
                        gap:          4,
                        padding:      "6px 10px",
                        fontSize:     12,
                        fontWeight:   600,
                        borderRadius: 8,
                        background:   "var(--status-recovered)",
                        color:        "var(--text-inverse)",
                        cursor:       "pointer",
                      }}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => reject(s)}
                      title="Reject this application"
                      style={{
                        display:      "inline-flex",
                        alignItems:   "center",
                        gap:          4,
                        padding:      "6px 10px",
                        fontSize:     12,
                        fontWeight:   500,
                        borderRadius: 8,
                        background:   "var(--bg-base)",
                        color:        "var(--text-secondary)",
                        border:       "1px solid var(--border-default)",
                        cursor:       "pointer",
                      }}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop:    10,
                  fontSize:     13,
                  lineHeight:   "20px",
                  whiteSpace:   "pre-wrap",
                  color:        "var(--text-secondary)",
                }}
              >
                {s.contribution_statement}
              </div>

              {s.reviewer_note && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize:  12,
                    color:     "var(--text-tertiary)",
                  }}
                >
                  <strong>Reviewer note:</strong> {s.reviewer_note}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: PendingSignup["status"] }) {
  const colors: Record<PendingSignup["status"], string> = {
    pending:  "var(--accent)",
    approved: "var(--status-recovered)",
    rejected: "var(--status-fatal)",
  };
  return (
    <span style={{ color: colors[status], fontWeight: 600, textTransform: "uppercase" }}>
      {status}
    </span>
  );
}
