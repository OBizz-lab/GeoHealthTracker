"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
  reported_date: string | null;
  source_url: string | null;
  notes: string | null;
  is_published: boolean;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  ingestion_sources: { name: string; slug: string } | null;
}

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

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
    const supabase = getClient();
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
  onApprove,
  onReject,
}: {
  c: PendingCase;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    confirmed: "bg-green-900 text-green-300",
    suspected: "bg-yellow-900 text-yellow-300",
    fatal: "bg-red-900 text-red-300",
  };

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
            <span>{c.case_count} case{c.case_count !== 1 ? "s" : ""}</span>
            {c.reported_date && <span>{c.reported_date}</span>}
            <span>Source: {c.ingestion_sources?.name ?? "unknown"}</span>
            {c.location_lat == null && (
              <span className="text-amber-500">⚠ Not geocoded</span>
            )}
            {c.is_published && (
              <span className="text-blue-400">● Published</span>
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
              className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
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
  const [session, setSession] = useState<unknown>(null);
  const [cases, setCases] = useState<PendingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "published" | "all">("pending");

  const supabase = getClient();

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cases when authed
  useEffect(() => {
    if (!session) return;
    loadCases();
  }, [session, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCases() {
    setLoading(true);
    let q = supabase
      .from("cases")
      .select(`id, location_name, country, state_province, status, strain, case_count, reported_date, source_url, notes, is_published, location_lat, location_lng, created_at, ingestion_sources(name, slug)`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter === "pending") q = q.eq("is_published", false);
    else if (filter === "published") q = q.eq("is_published", true);

    const { data } = await q;
    setCases((data as unknown as PendingCase[]) ?? []);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    await supabase.from("cases").update({ is_published: true }).eq("id", id);
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
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
