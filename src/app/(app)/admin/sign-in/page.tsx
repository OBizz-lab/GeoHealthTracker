"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getSupabaseClientStrict } from "@/lib/supabase/client";

export default function AdminSignInPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);

  // If already signed in, bounce straight to /cases.
  useEffect(() => {
    const supabase = getSupabaseClientStrict();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/cases");
      else setChecking(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = getSupabaseClientStrict();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // If the user is approved → /cases. Otherwise → /admin/pending.
    if (data.session) {
      const { data: grant } = await supabase
        .from("admin_grants")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (grant) {
        router.replace("/cases");
      } else {
        router.replace("/admin/pending");
      }
    } else {
      router.replace("/cases");
    }
  }

  if (checking) return null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-sm"
        style={{
          background:   "var(--bg-surface)",
          border:       "1px solid var(--border-default)",
          borderRadius: 12,
          padding:      32,
        }}
      >
        <h1
          className="t-h2"
          style={{ color: "var(--text-primary)", marginBottom: 4 }}
        >
          Admin sign in
        </h1>
        <p
          className="t-cap"
          style={{ color: "var(--text-secondary)", marginBottom: 20 }}
        >
          Vetted contributors only. Submissions go through moderation.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 14 }}>
          <label className="flex flex-col" style={{ gap: 4 }}>
            <span className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              style={{
                fontSize:     13,
                padding:      "10px 12px",
                borderRadius: 8,
                background:   "var(--bg-base)",
                border:       "1px solid var(--border-default)",
                color:        "var(--text-primary)",
              }}
            />
          </label>

          <label className="flex flex-col" style={{ gap: 4 }}>
            <span className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                fontSize:     13,
                padding:      "10px 12px",
                borderRadius: 8,
                background:   "var(--bg-base)",
                border:       "1px solid var(--border-default)",
                color:        "var(--text-primary)",
              }}
            />
          </label>

          {error && (
            <div
              role="alert"
              style={{
                fontSize: 12,
                color:    "var(--status-fatal)",
                background: "rgba(201,42,79,0.08)",
                padding:    "8px 10px",
                borderRadius: 6,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding:      "10px 12px",
              fontSize:     13,
              fontWeight:   600,
              borderRadius: 8,
              background:   "var(--accent)",
              color:        "var(--text-inverse)",
              opacity:      loading ? 0.6 : 1,
              cursor:       loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div
          style={{
            marginTop:  18,
            paddingTop: 14,
            borderTop:  "1px solid var(--border-subtle)",
            display:    "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize:   12,
            color:      "var(--text-tertiary)",
          }}
        >
          <span>
            New here?{" "}
            <Link href="/admin/sign-up" style={{ color: "var(--accent)" }}>
              Apply to contribute
            </Link>
          </span>
          <Link href="/cases" style={{ color: "var(--text-tertiary)" }}>
            ← Public cases
          </Link>
        </div>
      </div>
    </main>
  );
}
