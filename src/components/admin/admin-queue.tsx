"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  readStoredSession,
  fetchIsApprovedAdmin,
  fetchQueueCases,
  fetchPendingSignupCount,
  updateCasePublished,
  rejectCase,
  clearStoredSession,
  notifyAuthChange,
  type StoredSession,
  type QueuedCase,
} from "@/lib/auth/session";

// =============================================================================
// Admin Moderation Queue
// All Supabase access uses the lock-free raw-fetch helpers in lib/auth/session
// rather than @supabase/supabase-js, because the SDK's navigator.locks mutex
// can stay poisoned (HMR / hung auto-refresh) and freeze the whole page.
// =============================================================================

function CaseCard({
  c,
  currentUserId,
  onApprove,
  onReject,
}: {
  c: QueuedCase;
  currentUserId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    confirmed: "bg-green-900 text-green-300",
    suspected: "bg-yellow-900 text-yellow-300",
    fatal:     "bg-red-900 text-red-300",
  };
  const isOwnSubmission =
    !c.is_published && c.submitted_by != null && c.submitted_by === currentUserId;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">
              {c.location_name ?? "Unknown location"}
            </span>
            {c.country && c.country !== "ZZ" && (
              <span className="text-xs text-zinc-500">{c.country}</span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] ?? "bg-zinc-700 text-zinc-300"}`}
            >
              {c.status}
            </span>
            {c.strain && (
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                {c.strain.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>
              {c.case_count} case{c.case_count !== 1 ? "s" : ""}
              {c.fatality_count > 0 && ` · ${c.fatality_count} fatal`}
            </span>
            {c.reported_date && <span>{c.reported_date}</span>}
            <span>Source: {c.ingestion_sources?.name ?? (c.submitted_by ? "community submission" : "unknown")}</span>
            {c.location_lat == null && (
              <span className="text-amber-500">⚠ Not geocoded</span>
            )}
            {c.is_published && (
              <span className="text-blue-400">● Published</span>
            )}
            {isOwnSubmission && (
              <span className="text-amber-500">⚠ Your submission — another admin must approve</span>
            )}
          </div>

          {c.notes && (
            <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{c.notes}</p>
          )}

          {c.source_url && (
            <a
              href={c.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-blue-400 hover:underline"
            >
              View source ↗
            </a>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {!c.is_published && (
            <button
              onClick={() => onApprove(c.id)}
              disabled={isOwnSubmission}
              title={isOwnSubmission ? "Another admin must approve your own submission" : undefined}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
                isOwnSubmission
                  ? "bg-zinc-700 cursor-not-allowed opacity-60"
                  : "bg-green-700 hover:bg-green-600"
              }`}
            >
              ✓ Approve
            </button>
          )}
          <button
            onClick={() => onReject(c.id)}
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            ✕ {c.is_published ? "Unpublish" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminQueue() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isApprovedAdmin, setIsApprovedAdmin] = useState<boolean | null>(null);
  const [pendingSignupCount, setPendingSignupCount] = useState(0);
  const [cases, setCases] = useState<QueuedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "published" | "all">("pending");
  const [actionError, setActionError] = useState("");

  const currentUserId = session?.user_id ?? null;

  // Auth + admin status on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sess = readStoredSession();
      if (cancelled) return;
      setSession(sess);
      if (!sess) {
        setIsApprovedAdmin(false);
        setLoading(false);
        return;
      }
      const approved = await fetchIsApprovedAdmin(sess);
      if (cancelled) return;
      setIsApprovedAdmin(approved);
      if (approved) {
        const c = await fetchPendingSignupCount(sess);
        if (!cancelled) setPendingSignupCount(c);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadCases = useCallback(async () => {
    if (!session || !isApprovedAdmin) return;
    setLoading(true);
    const rows = await fetchQueueCases(session, filter);
    setCases(rows);
    setLoading(false);
  }, [session, isApprovedAdmin, filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadCases();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [loadCases]);

  async function handleApprove(id: string) {
    if (!session) return;
    setActionError("");
    const target = cases.find((c) => c.id === id);
    if (target?.submitted_by && target.submitted_by === currentUserId) {
      setActionError("You can't approve your own submission — another admin must do it.");
      return;
    }
    const err = await updateCasePublished(session, id, true);
    if (err) { setActionError(err); return; }
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, is_published: true } : c)));
  }

  async function handleReject(id: string) {
    if (!session) return;
    const c = cases.find((x) => x.id === id);
    if (c?.is_published) {
      // Published case: just unpublish, no rejection mark. Lets a case
      // come back into the pending queue if needed.
      const err = await updateCasePublished(session, id, false);
      if (err) { setActionError(err); return; }
      setCases((prev) => prev.map((x) => (x.id === id ? { ...x, is_published: false } : x)));
    } else {
      // Pending case: soft-reject. Row stays in the DB so /admin/list can
      // count it under the submitter's rejected total. Drops out of the
      // pending filter (rejected_at is.null).
      const err = await rejectCase(session, id);
      if (err) { setActionError(err); return; }
      setCases((prev) => prev.filter((x) => x.id !== id));
    }
  }

  function handleSignOut() {
    clearStoredSession();
    notifyAuthChange();
    setSession(null);
    setCases([]);
    router.replace("/admin/sign-in");
  }

  // Not signed in — bounce to the dedicated sign-in page
  useEffect(() => {
    if (!session && !loading) router.replace("/admin/sign-in");
  }, [session, loading, router]);
  if (!session && !loading) return null;

  // Signed in but not yet an approved admin
  if (session && isApprovedAdmin === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="mb-3 text-xl font-semibold text-white">
          Your account is pending approval
        </h2>
        <p className="mb-5 text-sm text-zinc-400">
          You&apos;re signed in, but you don&apos;t have admin access yet.
          Another admin needs to approve your application.
        </p>
        <Link
          href="/admin/pending"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Check status →
        </Link>
      </div>
    );
  }

  const pending = cases.filter((c) => !c.is_published).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Moderation Queue</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {pending} pending · {cases.length - pending} published
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/grants"
            className="relative rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Admin grants
            {pendingSignupCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white"
                title={`${pendingSignupCount} pending application${pendingSignupCount === 1 ? "" : "s"}`}
              >
                {pendingSignupCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/cookbook"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
          >
            Cookbook
          </Link>
          <button
            onClick={loadCases}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            ↻ Refresh
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 w-fit">
        {(["pending", "published", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 py-20 text-center text-zinc-500">
          {filter === "pending" ? "No pending cases 🎉" : "No cases found"}
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <CaseCard
              key={c.id}
              c={c}
              currentUserId={currentUserId}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
