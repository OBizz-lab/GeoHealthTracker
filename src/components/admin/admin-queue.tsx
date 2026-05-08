"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getSupabaseClientStrict } from "@/lib/supabase/client";

// =============================================================================
// Admin Moderation Queue
// Requires Supabase Auth — sign in with your admin email/password.
// Authenticated users can approve or reject pending cases.
// =============================================================================

interface PendingCase {
  id: string;
  location_name: string | null;
  country: string | null;
  state_province: string | null;
  status: string;
  strain: string | null;
  case_count: number;
  fatality_count: number;
  reported_date: string | null;
  source_url: string | null;
  notes: string | null;
  is_published: boolean;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  submitted_by: string | null;
  ingestion_sources: { name: string; slug: string } | null;
}

// Supabase client is now obtained from the shared singleton
// (lib/supabase/client.ts). Calling createClient() per render — as this file
// previously did — spawned a fresh GoTrueClient on every render and produced
// the "Multiple GoTrueClient instances" warning storm.

// ---------------------------------------------------------------------------
// Sign-in form
// ---------------------------------------------------------------------------
function SignInForm({ onSignIn }: { onSignIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = getSupabaseClientStrict();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onSignIn();
    setLoading(false);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h2 className="mb-6 text-xl font-semibold text-white">Admin Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Case card
// ---------------------------------------------------------------------------
function CaseCard({
  c,
  currentUserId,
  onApprove,
  onReject,
}: {
  c: PendingCase;
  currentUserId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    confirmed: "bg-green-900 text-green-300",
    suspected: "bg-yellow-900 text-yellow-300",
    fatal: "bg-red-900 text-red-300",
  };
  const isOwnSubmission =
    !c.is_published && c.submitted_by != null && c.submitted_by === currentUserId;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Location + status */}
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

          {/* Meta */}
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

          {/* Notes */}
          {c.notes && (
            <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{c.notes}</p>
          )}

          {/* Source link */}
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

        {/* Action buttons */}
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

// ---------------------------------------------------------------------------
// Main queue component
// ---------------------------------------------------------------------------
export function AdminQueue() {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [isApprovedAdmin, setIsApprovedAdmin] = useState<boolean | null>(null);
  const [pendingSignupCount, setPendingSignupCount] = useState(0);
  const [cases, setCases] = useState<PendingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "published" | "all">("pending");
  const [actionError, setActionError] = useState("");

  const supabase = getSupabaseClientStrict();
  const currentUserId = session?.user.id ?? null;

  // Check auth + admin status on mount
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const { data } = await supabase.auth.getSession();
      const sess = (data.session as unknown as { user: { id: string } } | null) ?? null;
      if (cancelled) return;
      setSession(sess);
      if (!sess) {
        setIsApprovedAdmin(false);
        setLoading(false);
        return;
      }
      const { data: grant } = await supabase
        .from("admin_grants")
        .select("user_id")
        .eq("user_id", sess.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (cancelled) return;
      const approved = !!grant;
      setIsApprovedAdmin(approved);
      if (approved) {
        const { count } = await supabase
          .from("admin_signups")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        if (!cancelled) setPendingSignupCount(count ?? 0);
      }
      setLoading(false);
    }

    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(refresh);
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cases only when authed AND approved
  useEffect(() => {
    if (!session || !isApprovedAdmin) return;
    loadCases();
  }, [session, isApprovedAdmin, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCases() {
    setLoading(true);
    let q = supabase
      .from("cases")
      .select(`id, location_name, country, state_province, status, strain, case_count, fatality_count, reported_date, source_url, notes, is_published, location_lat, location_lng, created_at, submitted_by, ingestion_sources(name, slug)`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter === "pending") q = q.eq("is_published", false);
    else if (filter === "published") q = q.eq("is_published", true);

    const { data } = await q;
    setCases((data as unknown as PendingCase[]) ?? []);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    setActionError("");
    const target = cases.find((c) => c.id === id);
    if (target?.submitted_by && target.submitted_by === currentUserId) {
      setActionError("You can't approve your own submission — another admin must do it.");
      return;
    }
    const { error } = await supabase
      .from("cases")
      .update({ is_published: true })
      .eq("id", id);
    if (error) {
      setActionError(error.message);
      return;
    }
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, is_published: true } : c)));
  }

  async function handleReject(id: string) {
    const c = cases.find((x) => x.id === id);
    if (c?.is_published) {
      // Unpublish instead of delete
      await supabase.from("cases").update({ is_published: false }).eq("id", id);
      setCases((prev) => prev.map((x) => (x.id === id ? { ...x, is_published: false } : x)));
    } else {
      await supabase.from("cases").delete().eq("id", id);
      setCases((prev) => prev.filter((x) => x.id !== id));
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setCases([]);
  }

  // Not signed in
  if (!session && !loading) {
    return <SignInForm onSignIn={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;
  }

  // Signed in but not yet an approved admin → friendly nudge
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
      {/* Header */}
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

      {/* Filter tabs */}
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

      {/* Cases list */}
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
