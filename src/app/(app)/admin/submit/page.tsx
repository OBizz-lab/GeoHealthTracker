"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getSupabaseClientStrict } from "@/lib/supabase/client";

interface FormState {
  source_url:      string;
  location_name:   string;
  country:         string;
  state_province:  string;
  location_lat:    string;
  location_lng:    string;
  status:          "suspected" | "confirmed" | "fatal";
  strain:          "" | "sin_nombre" | "andes" | "seoul" | "puumala" | "other";
  case_count:      string;
  fatality_count:  string;
  reported_date:   string;
  notes:           string;
}

const INITIAL: FormState = {
  source_url:     "",
  location_name:  "",
  country:        "",
  state_province: "",
  location_lat:   "",
  location_lng:   "",
  status:         "suspected",
  strain:         "",
  case_count:     "1",
  fatality_count: "0",
  reported_date:  new Date().toISOString().slice(0, 10),
  notes:          "",
};

export default function AdminSubmitPage() {
  const router = useRouter();
  const [form, setForm]       = useState<FormState>(INITIAL);
  const [error, setError]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated]     = useState(false);

  // Auth + admin-grant gate — bounce to sign-in if not authed; bounce to
  // /admin/pending if authed but not yet an approved admin.
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
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!/^https:\/\//.test(form.source_url)) {
      setError("Source URL must start with https://");
      return;
    }
    const cc = parseInt(form.case_count, 10);
    const fc = parseInt(form.fatality_count, 10);
    if (!Number.isFinite(cc) || cc < 1) { setError("Case count must be ≥ 1."); return; }
    if (!Number.isFinite(fc) || fc < 0) { setError("Fatality count must be ≥ 0."); return; }
    if (fc > cc) { setError("Fatality count cannot exceed case count."); return; }
    if (form.status === "fatal" && fc < 1) {
      setError("Status 'fatal' requires fatality count ≥ 1."); return;
    }

    const lat = form.location_lat ? parseFloat(form.location_lat) : null;
    const lng = form.location_lng ? parseFloat(form.location_lng) : null;
    if ((lat == null) !== (lng == null)) {
      setError("Provide both latitude and longitude, or neither.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseClientStrict();

      const { data: sess, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) { setError(`Session error: ${sessErr.message}`); setSubmitting(false); return; }
      const userId = sess.session?.user.id;
      if (!userId) { setError("Session expired. Sign in again."); setSubmitting(false); return; }

      const { data: disease, error: diseaseErr } = await supabase
        .from("diseases")
        .select("id")
        .eq("slug", "hantavirus")
        .single();
      if (diseaseErr) { setError(`Disease lookup failed: ${diseaseErr.message}`); setSubmitting(false); return; }
      if (!disease) { setError("Cannot resolve disease."); setSubmitting(false); return; }

      const { error: insertErr } = await supabase.from("cases").insert({
        disease_id:     (disease as { id: string }).id,
        kind:           "confirmed",
        source_url:     form.source_url,
        location_name:  form.location_name || null,
        country:        form.country.toUpperCase() || null,
        state_province: form.state_province || null,
        location_lat:   lat,
        location_lng:   lng,
        status:         form.status,
        strain:         form.strain || null,
        case_count:     cc,
        fatality_count: fc,
        reported_date:  form.reported_date,
        notes:          form.notes || null,
        is_published:   false,
        submitted_by:   userId,
      });

      if (insertErr) {
        // Surface the full error including code so we can debug RLS/CHECK
        // failures the user might otherwise never see.
        console.error("[submit] insert failed", insertErr);
        setError(`Insert failed: ${insertErr.message}${insertErr.code ? ` (code ${insertErr.code})` : ""}`);
        setSubmitting(false);
        return;
      }

      router.replace("/cases?submitted=1");
    } catch (err) {
      console.error("[submit] unexpected error", err);
      setError(err instanceof Error ? err.message : "Unexpected error during submission.");
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto w-full px-5 py-10 md:px-16 md:py-16" style={{ maxWidth: 720 }}>
      <Link
        href="/cases"
        style={{ fontSize: 12, color: "var(--text-tertiary)" }}
      >
        ← Back to cases
      </Link>

      <h1
        className="t-display"
        style={{ margin: "12px 0 8px", color: "var(--text-primary)" }}
      >
        Submit a case
      </h1>
      <p
        style={{
          fontSize:    14,
          lineHeight:  "22px",
          marginBottom: 32,
          color:       "var(--text-secondary)",
        }}
      >
        Your submission goes to the moderation queue as <strong>unconfirmed</strong>.
        Another admin must approve it before it counts toward case totals on the public map.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 18 }}>
        <Field label="Source URL (required)">
          <input
            type="url"
            value={form.source_url}
            onChange={(e) => set("source_url", e.target.value)}
            required
            placeholder="https://..."
            style={inputStyle}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Location name">
            <input
              type="text"
              value={form.location_name}
              onChange={(e) => set("location_name", e.target.value)}
              placeholder="e.g. Rio Arriba County, NM"
              style={inputStyle}
            />
          </Field>
          <Field label="Country (ISO-2)">
            <input
              type="text"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="e.g. US, AR, CL"
              maxLength={2}
              style={inputStyle}
            />
          </Field>
          <Field label="State / province">
            <input
              type="text"
              value={form.state_province}
              onChange={(e) => set("state_province", e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Reported date">
            <input
              type="date"
              value={form.reported_date}
              onChange={(e) => set("reported_date", e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Latitude (optional)">
            <input
              type="number"
              step="any"
              value={form.location_lat}
              onChange={(e) => set("location_lat", e.target.value)}
              placeholder="36.17"
              style={inputStyle}
            />
          </Field>
          <Field label="Longitude (optional)">
            <input
              type="number"
              step="any"
              value={form.location_lng}
              onChange={(e) => set("location_lng", e.target.value)}
              placeholder="-115.14"
              style={inputStyle}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as FormState["status"])}
              style={inputStyle}
            >
              <option value="suspected">Suspected</option>
              <option value="confirmed">Confirmed</option>
              <option value="fatal">Fatal</option>
            </select>
          </Field>
          <Field label="Strain (optional)">
            <select
              value={form.strain}
              onChange={(e) => set("strain", e.target.value as FormState["strain"])}
              style={inputStyle}
            >
              <option value="">—</option>
              <option value="sin_nombre">Sin Nombre</option>
              <option value="andes">Andes</option>
              <option value="seoul">Seoul</option>
              <option value="puumala">Puumala</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Case count">
            <input
              type="number"
              min={1}
              value={form.case_count}
              onChange={(e) => set("case_count", e.target.value)}
              required
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Fatality count (subset of case count)">
          <input
            type="number"
            min={0}
            value={form.fatality_count}
            onChange={(e) => set("fatality_count", e.target.value)}
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={4}
            placeholder="Brief description, source context, anything a reviewer should know."
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          />
        </Field>

        {error && (
          <div
            role="alert"
            style={{
              fontSize:     12,
              color:        "var(--status-fatal)",
              background:   "rgba(201,42,79,0.08)",
              padding:      "10px 12px",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end" style={{ gap: 10 }}>
          <Link
            href="/cases"
            style={{
              fontSize:     13,
              padding:      "10px 14px",
              color:        "var(--text-secondary)",
              borderRadius: 8,
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding:      "10px 18px",
              fontSize:     13,
              fontWeight:   600,
              borderRadius: 8,
              background:   "var(--accent)",
              color:        "var(--text-inverse)",
              opacity:      submitting ? 0.6 : 1,
              cursor:       submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col" style={{ gap: 6 }}>
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
