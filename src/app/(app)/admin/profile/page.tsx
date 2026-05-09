"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ShieldCheck, User, Clock } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase/client";
import {
  readStoredSession,
  fetchIsApprovedAdmin,
  readUsername,
  clearStoredSession,
  notifyAuthChange,
} from "@/lib/auth/session";

// =============================================================================
// /admin/profile — minimal "your profile" view. Shows the user's chosen
// username, admin status, and a sign-out button. Lock-free: never calls
// any @supabase/supabase-js method that goes through the auth mutex.
// =============================================================================

type AdminStatus = "approved" | "pending" | "unknown";

export default function ProfilePage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [username, setUsername] = useState("");
  const [status, setStatus]     = useState<AdminStatus>("unknown");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = readStoredSession();
      if (!session) {
        if (!cancelled) router.replace("/admin/sign-in");
        return;
      }
      const name     = readUsername(session);
      const approved = await fetchIsApprovedAdmin(session);
      if (cancelled) return;
      setUsername(name);
      setStatus(approved ? "approved" : "pending");
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  function handleSignOut() {
    clearStoredSession();
    notifyAuthChange();
    const supabase = getSupabaseClient();
    if (supabase) {
      void supabase.auth.signOut().catch(() => { /* */ });
    }
    router.replace("/");
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto w-full px-5 py-10 md:px-16 md:py-16" style={{ maxWidth: 560 }}>
      <Link
        href="/cases"
        style={{ fontSize: 12, color: "var(--text-tertiary)" }}
      >
        ← Back to cases
      </Link>

      <div className="mt-3 flex items-center" style={{ gap: 10 }}>
        <User className="h-4 w-4" style={{ color: "var(--accent)" }} />
        <span className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          Your profile
        </span>
      </div>
      <h1
        className="t-display"
        style={{ margin: "8px 0 24px", color: "var(--text-primary)" }}
      >
        {username || "—"}
      </h1>

      <div
        style={{
          background:   "var(--bg-surface)",
          border:       "1px solid var(--border-default)",
          borderRadius: 12,
          padding:      20,
          display:      "flex",
          flexDirection:"column",
          gap:          18,
        }}
      >
        <Row label="Username" value={username || "—"} />
        <Row
          label="Status"
          value={
            <StatusBadge status={status} />
          }
        />
        <Row
          label="Sign in method"
          value={
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Username + password
            </span>
          }
        />
      </div>

      <div className="mt-6 flex" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center"
          style={{
            gap:          6,
            padding:      "8px 14px",
            fontSize:     13,
            fontWeight:   500,
            borderRadius: 8,
            background:   "var(--bg-surface)",
            color:        "var(--text-secondary)",
            border:       "1px solid var(--border-default)",
            cursor:       "pointer",
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 12 }}>
      <span
        className="t-cap t-up"
        style={{ color: "var(--text-tertiary)", fontSize: 11 }}
      >
        {label}
      </span>
      <span style={{ textAlign: "right" }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminStatus }) {
  if (status === "approved") {
    return (
      <span
        className="inline-flex items-center"
        style={{
          gap: 4,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--status-recovered)",
        }}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Approved admin
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--accent)",
      }}
    >
      <Clock className="h-3.5 w-3.5" />
      Pending review
    </span>
  );
}
