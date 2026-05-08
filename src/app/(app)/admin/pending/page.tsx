"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, Mail } from "lucide-react";

import { getSupabaseClientStrict } from "@/lib/supabase/client";

// =============================================================================
// /admin/pending — what a newly-signed-up user sees while waiting for approval.
// Polls admin_signups every 10s for status changes; if approved, the page
// nudges the user to /cases.
// =============================================================================

type Status = "pending" | "approved" | "rejected" | "unknown" | "needs_email_confirm" | "needs_statement";

export default function AdminPendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("unknown");
  const [reviewerNote, setReviewerNote] = useState<string | null>(null);
  const [recoveryStatement, setRecoveryStatement] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClientStrict();
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function refresh() {
      const { data: sess } = await supabase.auth.getSession();
      // No session → check if we're in the "just-confirmed-email" flow.
      if (!sess.session) {
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (url.searchParams.get("confirm-email") === "1") {
            if (!cancelled) setStatus("needs_email_confirm");
            return;
          }
        }
        if (!cancelled) router.replace("/admin/sign-in");
        return;
      }

      // Approved admin → /cases
      const { data: grant } = await supabase
        .from("admin_grants")
        .select("user_id")
        .eq("user_id", sess.session.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (grant && !cancelled) {
        router.replace("/cases");
        return;
      }

      const { data: signup } = await supabase
        .from("admin_signups")
        .select("status, reviewer_note")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();

      if (signup) {
        if (!cancelled) {
          setStatus((signup.status as Status) ?? "unknown");
          setReviewerNote((signup.reviewer_note as string | null) ?? null);
        }
        return;
      }

      // Signed in but no admin_signups row — recover from localStorage if we
      // can; otherwise prompt the user for their contribution statement.
      let stored: { contribution?: string } | null = null;
      try {
        const raw = window.localStorage.getItem("pendingContribution");
        if (raw) stored = JSON.parse(raw) as { contribution?: string };
      } catch { /* */ }

      if (stored?.contribution) {
        const { error: insErr } = await supabase.from("admin_signups").insert({
          user_id: sess.session.user.id,
          username: sess.session.user.email ?? "",
          contribution_statement: stored.contribution,
        });
        if (!insErr) {
          try { window.localStorage.removeItem("pendingContribution"); } catch { /* */ }
          if (!cancelled) setStatus("pending");
        } else if (!cancelled) {
          setStatus("needs_statement");
        }
        return;
      }

      if (!cancelled) setStatus("needs_statement");
    }

    refresh();
    interval = setInterval(refresh, 10_000);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [router]);

  async function submitRecovery(e: React.FormEvent) {
    e.preventDefault();
    setRecoveryError("");
    if (recoveryStatement.trim().length < 30) {
      setRecoveryError("Please write at least 30 characters about how you'll contribute.");
      return;
    }
    setRecovering(true);
    const supabase = getSupabaseClientStrict();
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { router.replace("/admin/sign-in"); return; }
    const { error: insErr } = await supabase.from("admin_signups").insert({
      user_id: sess.session.user.id,
      username: sess.session.user.email ?? "",
      contribution_statement: recoveryStatement.trim(),
    });
    setRecovering(false);
    if (insErr) { setRecoveryError(insErr.message); return; }
    setStatus("pending");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-md"
        style={{
          background:   "var(--bg-surface)",
          border:       "1px solid var(--border-default)",
          borderRadius: 12,
          padding:      32,
        }}
      >
        <Header status={status} />
        <Body status={status} reviewerNote={reviewerNote} />

        {status === "needs_statement" && (
          <form onSubmit={submitRecovery} className="mt-5 flex flex-col" style={{ gap: 10 }}>
            <textarea
              value={recoveryStatement}
              onChange={(e) => setRecoveryStatement(e.target.value)}
              required
              rows={4}
              maxLength={1000}
              placeholder="A few sentences about how you plan to contribute…"
              style={{
                fontSize:     13,
                padding:      "10px 12px",
                borderRadius: 8,
                background:   "var(--bg-base)",
                border:       "1px solid var(--border-default)",
                color:        "var(--text-primary)",
                fontFamily:   "inherit",
                resize:       "vertical",
              }}
            />
            {recoveryError && (
              <div role="alert" style={{ fontSize: 12, color: "var(--status-fatal)" }}>
                {recoveryError}
              </div>
            )}
            <button
              type="submit"
              disabled={recovering}
              style={{
                padding:      "10px 12px",
                fontSize:     13,
                fontWeight:   600,
                borderRadius: 8,
                background:   "var(--accent)",
                color:        "var(--text-inverse)",
                opacity:      recovering ? 0.6 : 1,
                cursor:       recovering ? "wait" : "pointer",
              }}
            >
              {recovering ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}

        <div
          style={{
            marginTop:    24,
            paddingTop:   16,
            borderTop:    "1px solid var(--border-subtle)",
            fontSize:     12,
            color:        "var(--text-tertiary)",
          }}
        >
          <Link href="/cases" style={{ color: "var(--text-tertiary)" }}>
            ← Back to public cases
          </Link>
        </div>
      </div>
    </main>
  );
}

function Header({ status }: { status: Status }) {
  if (status === "approved") {
    return (
      <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
        <CheckCircle2 className="h-5 w-5" style={{ color: "var(--status-recovered)" }} />
        <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>
          Approved — welcome
        </h1>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
        <XCircle className="h-5 w-5" style={{ color: "var(--status-fatal)" }} />
        <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>
          Application not approved
        </h1>
      </div>
    );
  }
  if (status === "needs_email_confirm") {
    return (
      <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
        <Mail className="h-5 w-5" style={{ color: "var(--accent)" }} />
        <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>
          Check your email
        </h1>
      </div>
    );
  }
  if (status === "needs_statement") {
    return (
      <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
        <Clock className="h-5 w-5" style={{ color: "var(--accent)" }} />
        <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>
          One more step
        </h1>
      </div>
    );
  }
  return (
    <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
      <Clock className="h-5 w-5" style={{ color: "var(--accent)" }} />
      <h1 className="t-h2" style={{ color: "var(--text-primary)" }}>
        Application pending review
      </h1>
    </div>
  );
}

function Body({ status, reviewerNote }: { status: Status; reviewerNote: string | null }) {
  if (status === "approved") {
    return (
      <p style={{ fontSize: 14, lineHeight: "22px", color: "var(--text-secondary)" }}>
        You&apos;re an approved admin. Redirecting you to the cases page…
      </p>
    );
  }
  if (status === "rejected") {
    return (
      <>
        <p style={{ fontSize: 14, lineHeight: "22px", color: "var(--text-secondary)", marginBottom: 12 }}>
          Your application was not approved. If you believe this is in error,
          contact <a href="mailto:bafagihomar260@gmail.com" style={{ color: "var(--accent)" }}>bafagihomar260@gmail.com</a>.
        </p>
        {reviewerNote && (
          <div
            style={{
              padding:      "10px 12px",
              borderRadius: 8,
              border:       "1px solid var(--border-subtle)",
              fontSize:     13,
              lineHeight:   "20px",
              color:        "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--text-primary)" }}>Reviewer note:</strong>{" "}
            {reviewerNote}
          </div>
        )}
      </>
    );
  }
  if (status === "needs_email_confirm") {
    return (
      <p style={{ fontSize: 14, lineHeight: "22px", color: "var(--text-secondary)" }}>
        Click the confirmation link in the email we just sent you, then come
        back to <Link href="/admin/sign-in" style={{ color: "var(--accent)" }}>sign in</Link>.
        After signing in your application will be queued for review.
      </p>
    );
  }
  if (status === "needs_statement") {
    return (
      <p style={{ fontSize: 14, lineHeight: "22px", color: "var(--text-secondary)" }}>
        Your account exists but we don&apos;t have your contribution statement
        on file yet. Tell us how you&apos;ll contribute and we&apos;ll queue
        your application for review.
      </p>
    );
  }
  return (
    <p style={{ fontSize: 14, lineHeight: "22px", color: "var(--text-secondary)" }}>
      Thanks for applying. An existing admin needs to review and approve your
      account before you can contribute. This usually takes a short while —
      this page checks in every few seconds and will route you forward
      automatically once approved.
    </p>
  );
}
