"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getSupabaseClient } from "@/lib/supabase/client";

// =============================================================================
// /admin/sign-up — three-field signup per the user's spec.
// "username" is the user's email (Supabase Auth needs an email); we label it
// plainly so the field is unambiguous. After signUp() succeeds, we insert a
// row in `admin_signups` with status='pending'. The user is then routed to
// /admin/pending where they wait for an approved admin to grant access.
// =============================================================================

export default function AdminSignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contribution, setContribution] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // If you're already authenticated, the signup form is the wrong place —
  // route to /admin/pending (which itself routes approved admins onward to
  // /cases). This is what the user wanted: revisiting /admin/sign-up while
  // already pending should land them on the status page, not a fresh form.
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setHydrated(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin/pending");
      else setHydrated(true);
    });
  }, [router]);

  if (!hydrated) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
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
    const supabase = getSupabaseClient();
    if (!supabase) { setError("Supabase is not configured."); setLoading(false); return; }

    // Create the auth.users row.
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

    const userId = signUpData.user?.id;
    if (!userId) {
      // No session and no user — should not happen in normal flow
      setError("Signup did not return a user record. Try again.");
      setLoading(false);
      return;
    }

    // Persist the contribution statement so we can write the admin_signups
    // row whether or not the user has a session yet (Supabase project email-
    // confirmation makes signUp() return no session — the row gets written
    // after the user confirms and signs in).
    try {
      window.localStorage.setItem(
        "pendingContribution",
        JSON.stringify({ email, contribution: contribution.trim() }),
      );
    } catch { /* localStorage unavailable; non-fatal */ }

    if (signUpData.session) {
      const { error: insertErr } = await supabase.from("admin_signups").insert({
        user_id: userId,
        username: email,
        contribution_statement: contribution.trim(),
      });
      if (insertErr) { setError(insertErr.message); setLoading(false); return; }
      try { window.localStorage.removeItem("pendingContribution"); } catch { /* */ }
      router.replace("/admin/pending");
    } else {
      router.replace("/admin/pending?confirm-email=1");
    }
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
          <Field label="Username (your email)">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              placeholder="name@example.com"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span className="t-cap t-up" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      {children}
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
