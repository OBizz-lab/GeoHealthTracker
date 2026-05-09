"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getSupabaseClientStrict } from "@/lib/supabase/client";
import { normalizeUsername, usernameToEmail } from "@/lib/auth/username";
import { readStoredSession, fetchIsApprovedAdmin, notifyAuthChange } from "@/lib/auth/session";

export default function AdminSignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);

  // "Already signed in?" check — read localStorage directly instead of
  // calling supabase.auth.getSession(), which goes through a navigator.locks
  // mutex that can stay poisoned and never resolve. The IIFE creates an
  // async boundary so React 19's set-state-in-effect rule is happy.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (readStoredSession()) router.replace("/cases");
      else setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = getSupabaseClientStrict();

    // Username → synthetic email. (If a value containing "@" is pasted in we
    // accept it as-is, so legacy email-based accounts keep working until
    // they're wiped.)
    const trimmed = username.trim();
    const email = trimmed.includes("@") ? trimmed.toLowerCase() : usernameToEmail(normalizeUsername(trimmed));

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const friendly = /invalid login credentials/i.test(error.message)
        ? "Username or password is incorrect."
        : error.message;
      setError(friendly);
      setLoading(false);
      return;
    }

    // signInWithPassword writes the session to localStorage synchronously
    // before resolving. Read it back via our lock-free helper instead of
    // calling getSession(), then check admin status with a raw fetch.
    const session = readStoredSession();
    if (!session) {
      setError("Sign-in succeeded but no session was stored. Try again.");
      setLoading(false);
      return;
    }
    const isAdmin = await fetchIsApprovedAdmin(session);
    notifyAuthChange();
    router.replace(isAdmin ? "/cases" : "/admin/pending");
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
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              spellCheck={false}
              autoCapitalize="none"
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
