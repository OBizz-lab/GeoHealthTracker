"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { readStoredSession, fetchIsApprovedAdmin } from "@/lib/auth/session";
import { submitCase } from "./actions";

type SubmissionKind = "confirmed" | "mention" | "exposed";

interface FormState {
  kind:            SubmissionKind;
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
  kind:           "confirmed",
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

const KIND_OPTIONS: { value: SubmissionKind; label: string; desc: string }[] = [
  { value: "confirmed", label: "Confirmed case", desc: "Verified case from an official health authority." },
  { value: "mention",   label: "Mention",        desc: "News article reporting hantavirus in a country with no confirmed cases yet." },
  { value: "exposed",   label: "Spread",         desc: "Surveillance follow-up — a contact of a confirmed case has returned to this country." },
];

export default function AdminSubmitPage() {
  const router = useRouter();
  const [form, setForm]             = useState<FormState>(INITIAL);
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated]     = useState(false);

  // Auth + admin-grant gate — uses lock-free helpers (raw localStorage read
  // for session, raw fetch for admin_grants). The browser supabase-js client
  // is unreliable on this codepath because its navigator.locks mutex can
  // get poisoned by HMR / hung auto-refresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = readStoredSession();
      if (!session) {
        if (!cancelled) router.replace("/admin/sign-in");
        return;
      }
      const isAdmin = await fetchIsApprovedAdmin(session);
      if (cancelled) return;
      if (!isAdmin) {
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

    // Client-side validation (server re-checks too)
    if (!/^https:\/\//.test(form.source_url)) {
      setError("Source URL must start with https://");
      return;
    }
    if (!form.country.trim()) {
      setError("Country (ISO-2) is required for every submission type.");
      return;
    }
    // Confirmed cases require precise counts; mention / spread auto-default
    // to representing one record.
    let cc: number;
    let fc: number;
    if (form.kind === "confirmed") {
      cc = parseInt(form.case_count, 10);
      fc = parseInt(form.fatality_count, 10);
      if (!Number.isFinite(cc) || cc < 1) { setError("Case count must be ≥ 1."); return; }
      if (!Number.isFinite(fc) || fc < 0) { setError("Fatality count must be ≥ 0."); return; }
      if (fc > cc) { setError("Fatality count cannot exceed case count."); return; }
      if (form.status === "fatal" && fc < 1) {
        setError("Status 'fatal' requires fatality count ≥ 1."); return;
      }
    } else {
      cc = 1;
      fc = 0;
    }
    const lat = form.location_lat ? parseFloat(form.location_lat) : null;
    const lng = form.location_lng ? parseFloat(form.location_lng) : null;
    if ((lat == null) !== (lng == null)) {
      setError("Provide both latitude and longitude, or neither.");
      return;
    }

    const session = readStoredSession();
    if (!session) {
      setError("Could not find your session. Sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitCase({
        accessToken: session.access_token,
        kind:           form.kind,
        source_url:     form.source_url,
        location_name:  form.location_name || null,
        country:        form.country.toUpperCase() || null,
        state_province: form.state_province || null,
        location_lat:   lat,
        location_lng:   lng,
        status:         form.kind === "confirmed" ? form.status : "suspected",
        strain:         form.kind === "confirmed" ? (form.strain || null) : null,
        case_count:     cc,
        fatality_count: fc,
        reported_date:  form.reported_date,
        notes:          form.notes || null,
      });

      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      router.replace("/cases?submitted=1");
    } catch (err) {
      console.error("[submit] server action failed", err);
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
        Submit a record
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
        Another admin must approve it before it appears on the public map.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 18 }}>
        {/* Type selector — picks which kind of record this is. */}
        <Field label="Type">
          <div className="grid gap-2 md:grid-cols-3">
            {KIND_OPTIONS.map((opt) => {
              const active = form.kind === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => set("kind", opt.value)}
                  className="text-left transition-colors"
                  style={{
                    padding:      "10px 12px",
                    borderRadius: 8,
                    border:       active
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border-default)",
                    background:   active
                      ? "var(--accent-muted)"
                      : "var(--bg-base)",
                    cursor:       "pointer",
                  }}
                  aria-pressed={active}
                >
                  <div
                    style={{
                      fontSize:   13,
                      fontWeight: 600,
                      color:      active ? "var(--accent)" : "var(--text-primary)",
                      marginBottom: 2,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    className="t-cap"
                    style={{ color: "var(--text-tertiary)", lineHeight: "15px" }}
                  >
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

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

        {form.kind === "confirmed" && (
          <>
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
          </>
        )}

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
