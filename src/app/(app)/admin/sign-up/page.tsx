"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getSupabaseClientStrict } from "@/lib/supabase/client";
import {
  USERNAME_HINT,
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from "@/lib/auth/username";
import { readStoredSession, insertAdminSignup, notifyAuthChange } from "@/lib/auth/session";

// =============================================================================
// /admin/sign-up — three-field signup: username, contribution, password.
// We never collect or send email. The client maps the username to a
// synthetic noreply address purely so Supabase Auth's data model is happy.
// After signUp() succeeds, we POST to admin_signups via raw fetch (rather
// than the SDK's `from(...).insert(...)`, which goes through the same
// poisoned navigator.locks mutex that breaks every other SDK call here).
// =============================================================================

export default function AdminSignUpPage() {
  const router = useRouter();
  const [username, setUsername]         = useState("");
  const [contribution, setContribution] = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [hydrated, setHydrated]         = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (readStoredSession()) router.replace("/admin/pending");
      else setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (!hydrated) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setError(`Invalid username. ${USERNAME_HINT}`);
      return;
    }
    if (contribution.trim().length < 30) {
      setError("Tell us a bit more about how you plan to contribute (at least 30 characters).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClientStrict();
    const syntheticEmail = usernameToEmail(normalized);

    const { error: signUpErr } = await supabase.auth.signUp({
      email:    syntheticEmail,
      password,
      options:  { data: { username: normalized } },
    });
    if (signUpErr) {
      const friendly = /already registered|already in use/i.test(signUpErr.message)
        ? "That username is already taken. Pick another."
        : signUpErr.message;
      setError(friendly);
      setLoading(false);
      return;
    }

    // signUp writes the session to localStorage synchronously before
    // resolving (when email confirmation is OFF, which it is). Read it
    // back via our lock-free helper rather than auth.getSession().
    const session = readStoredSession();
    if (!session) {
      // Should be unreachable — keep a stash so /admin/pending can recover.
      try {
        window.localStorage.setItem(
          "pendingContribution",
          JSON.stringify({ username: normalized, contribution: contribution.trim() }),
        );
      } catch { /* */ }
      setError("Signup created the account but no session was returned. Try signing in.");
      setLoading(false);
      return;
    }

    const insertErr = await insertAdminSignup(session, normalized, contribution.trim());
    if (insertErr) {
      // Stash the contribution so /admin/pending's recovery flow can retry.
      try {
        window.localStorage.setItem(
          "pendingContribution",
          JSON.stringify({ username: normalized, contribution: contribution.trim() }),
        );
      } catch { /* */ }
      setError(insertErr);
      setLoading(false);
      return;
    }

    notifyAuthChange();
    router.replace("/admin/pending");
  }

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
          Apply to contribute
        </h1>
        <p
          className="t-cap"
          style={{ color: "var(--text-secondary)", marginBottom: 4, lineHeight: "18px" }}
        >
          Fill this in and your account is created in a <em>pending</em> state.
          An existing admin will review your application — you&apos;ll get
          access once approved.
        </p>
        <p
          className="t-cap"
          style={{ color: "var(--text-tertiary)", marginBottom: 20, lineHeight: "16px" }}
        >
          Please read the{" "}
          <Link href="/admin/cookbook" style={{ color: "var(--accent)" }}>
            Admin Cookbook
          </Link>{" "}
          before applying.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 14 }}>
          <Field label="Username" hint={USERNAME_HINT}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              minLength={3}
              maxLength={32}
              placeholder="yourname"
              spellCheck={false}
              autoCapitalize="none"
              style={inputStyle}
            />
          </Field>

          <Field label="How will you contribute?">
            <textarea
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              required
              rows={4}
              maxLength={1000}
              placeholder="A few sentences about your background, why you want to help, and what kind of cases you'd verify or contribute."
              style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
            />
            <span
              className="t-cap"
              style={{ color: "var(--text-tertiary)" }}
            >
              {contribution.length} / 1000
            </span>
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={inputStyle}
            />
          </Field>

          {error && (
            <div
              role="alert"
              style={{
                fontSize:     12,
                color:        "var(--status-fatal)",
                background:   "rgba(201,42,79,0.08)",
                padding:      "8px 10px",
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
            {loading ? "Submitting…" : "Submit application"}
          </button>
        </form>

        <div
          style={{
            marginTop:  18,
            paddingTop: 14,
            borderTop:  "1px solid var(--border-subtle)",
            fontSize:   12,
            color:      "var(--text-tertiary)",
          }}
        >
          Already approved?{" "}
          <Link href="/admin/sign-in" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span
          className="t-cap"
          style={{ color: "var(--text-tertiary)", fontSize: 11, marginTop: 2 }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  fontSize:     13,
  padding:      "10px 12px",
  borderRadius: 8,
  background:   "var(--bg-base)",
  border:       "1px solid var(--border-default)",
  color:        "var(--text-primary)",
  width:        "100%",
};
