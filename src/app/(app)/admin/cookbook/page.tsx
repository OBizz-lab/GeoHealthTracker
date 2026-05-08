import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "Admin Cookbook — HantaVirusTrack",
  description:
    "Guidelines for HantaVirusTrack admins: how to add cases, when to confirm, how to evaluate new admin applicants, and what NOT to do.",
};

// =============================================================================
// /admin/cookbook — public reference for what admins should and shouldn't do.
// Linked from the signup form and the grants page so it's read before action.
// =============================================================================

export default function AdminCookbookPage() {
  return (
    <>
      <section
        className="mx-auto w-full px-5 py-10 md:px-16 md:py-16"
        style={{ maxWidth: 880 }}
      >
        <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          Reference
        </div>
        <h1
          className="t-display"
          style={{ margin: "12px 0 16px", color: "var(--text-primary)" }}
        >
          Admin Cookbook
        </h1>
        <p
          style={{
            fontSize:    15,
            lineHeight:  "24px",
            marginBottom: 16,
            color:       "var(--text-secondary)",
            maxWidth:    640,
          }}
        >
          What admins do, what they don&apos;t, and how to think when in doubt.
          The site&apos;s credibility is the only currency we have — when you act
          as an admin, you&apos;re vouching with that credibility.
        </p>

        <Callout tone="warn">
          <strong>The default is &quot;don&apos;t.&quot;</strong> If something is unclear,
          unsourced, ambiguous, or you&apos;re not sure — leave it pending and ask
          another admin. Wrong numbers do real harm; missing numbers don&apos;t.
        </Callout>

        {/* ── 1. Adding cases ─────────────────────────────────────── */}
        <H2>1. Adding a new case</H2>

        <H3>Required: a verifiable source link</H3>
        <P>
          Every case needs a <code style={codeStyle}>https://</code> source URL
          that anyone can click and read. Acceptable sources, in priority order:
        </P>
        <List>
          <li>
            <strong>WHO Disease Outbreak News</strong> — for international clusters.
          </li>
          <li>
            <strong>National public-health agencies</strong> — CDC NNDSS, Public
            Health Agency of Canada, ECDC, PAHO, Africa CDC.
          </li>
          <li>
            <strong>State, provincial, or national health departments</strong> —
            press releases, weekly bulletins, official statements.
          </li>
          <li>
            <strong>ProMED-mail</strong> — for early signal and corroboration.
          </li>
        </List>

        <H3>Not acceptable as the primary source</H3>
        <List>
          <li>News articles citing &quot;reports&quot; without naming an official agency.</li>
          <li>Social-media posts (Reddit, X, Bluesky) — even from journalists.</li>
          <li>Wikipedia — fine for orientation, but cite the underlying primary source instead.</li>
          <li>
            Other tracker sites — never copy a number from a peer aggregator.
            Find the source they cited and use that.
          </li>
        </List>

        <H3>Read the source before submitting</H3>
        <P>
          Open the URL. Read the article. Make sure the numbers in the case
          form match what the source actually says — including the &quot;as of&quot;
          date. Sources update in place; the count you saw yesterday may have
          changed.
        </P>

        <H3>Counting rules (load-bearing)</H3>
        <List>
          <li>
            <strong>case_count</strong> is the total distinct people in this row,
            including any deceased.
          </li>
          <li>
            <strong>fatality_count</strong> is the subset of those who died.
            Never larger than case_count. Never added to case_count separately.
          </li>
          <li>
            If a row has <code style={codeStyle}>fatality_count &gt; 0</code>,
            its <strong>status must be &quot;fatal.&quot;</strong>
          </li>
          <li>
            Don&apos;t mix individual and aggregate rows for the same outbreak.
            Pick one shape per cluster.
          </li>
        </List>

        {/* ── 2. Confirming cases ─────────────────────────────────── */}
        <H2>2. Confirming someone else&apos;s case</H2>

        <Callout tone="info">
          <strong>You can never confirm your own submission.</strong> The site
          enforces this in the database — another admin must approve.
        </Callout>

        <H3>Before you click Approve</H3>
        <List>
          <li>
            Open the source URL. Don&apos;t skim — read the relevant paragraphs.
            If the source is a long PDF, search for the city or country named.
          </li>
          <li>
            Verify every field: location, country code, date, status, strain,
            case count, fatality count.
          </li>
          <li>
            Check the date. If it&apos;s a fatal-status row with case_count
            &gt; fatality_count, that means survivors are also in the row —
            confirm the source says so.
          </li>
          <li>
            If anything in the notes doesn&apos;t match the source, click
            Reject and add a one-line note explaining what to fix.
          </li>
        </List>

        <H3>Reject &gt; Approve when in doubt</H3>
        <P>
          Approving a wrong row is publicly visible and embarrassing. Rejecting
          a borderline row is invisible and reversible. When the source is
          weak, ambiguous, or contradicts another official source, reject and
          ask the submitter to revise.
        </P>

        {/* ── 3. Approving new admins ─────────────────────────────── */}
        <H2>3. Approving new admin applicants</H2>

        <H3>What we&apos;re looking for</H3>
        <List>
          <li>
            <strong>Genuine intent.</strong> Someone explaining specifically how
            they want to help — not a one-line &quot;I&apos;d like to contribute.&quot;
          </li>
          <li>
            <strong>Domain context.</strong> Public-health workers, journalists
            covering health, students in epi/microbiology, OSINT researchers.
            Not required, but contextual fluency matters.
          </li>
          <li>
            <strong>Respectful tone.</strong> Mature, professional language.
            We&apos;re publishing data that affects how people think about a
            disease — flippant or trolling applicants don&apos;t belong here.
          </li>
        </List>

        <H3>What disqualifies an applicant</H3>
        <List>
          <li>Empty or generic contribution statement (&quot;I want to contribute&quot;).</li>
          <li>Inflammatory, conspiracy-flavored, or alarmist language.</li>
          <li>Self-promotion as the primary motive.</li>
          <li>A statement that suggests they&apos;ll editorialize or push an agenda.</li>
          <li>Anything that gives you a bad feeling. Trust that feeling — reject.</li>
        </List>

        <H3>If you reject, leave a note</H3>
        <P>
          The applicant sees the reviewer note on their pending page. A short,
          factual one-liner is enough (&quot;Application doesn&apos;t indicate
          public-health background; please reapply with more context.&quot;).
          Don&apos;t be cruel.
        </P>

        {/* ── 4. General ─────────────────────────────────────────── */}
        <H2>4. General behavior</H2>

        <List>
          <li>
            <strong>Don&apos;t editorialize</strong> in case notes. Stick to what
            the source says, in plain language.
          </li>
          <li>
            <strong>Don&apos;t push severity.</strong> WHO assesses MV Hondius
            as low risk to the general public. Our copy follows them. Do not
            frame anything as &quot;pandemic-like&quot; without an official source
            saying so.
          </li>
          <li>
            <strong>Don&apos;t guess geography.</strong> If a source says
            &quot;a returned passenger in Switzerland,&quot; place the row at the
            Swiss centroid — don&apos;t guess a canton.
          </li>
          <li>
            <strong>Don&apos;t delete cases that turn out wrong</strong> —
            unpublish them instead. The audit log preserves the history; the
            map just stops showing them.
          </li>
          <li>
            <strong>If you make a mistake, say so.</strong> Mention it in chat
            or unpublish the affected row and add a one-line correction note.
            The integrity of the data depends on us being willing to admit
            errors.
          </li>
        </List>

        {/* ── 5. Quick checklist ──────────────────────────────────── */}
        <H2>5. Quick checklists</H2>

        <Checklist
          title="Before submitting a case"
          items={[
            "I have an official-source URL that loads in a browser",
            "I read the relevant paragraph of the source",
            "case_count and fatality_count match what the source says",
            "fatality_count ≤ case_count",
            "If status='fatal', fatality_count ≥ 1",
            "Notes describe what's in the source — no editorializing",
          ]}
        />

        <Checklist
          title="Before approving someone else's case"
          items={[
            "I opened the source URL and read it",
            "Every field on the row matches the source",
            "I am NOT the submitter",
            "If anything is off, I rejected with a one-line note instead of approving",
          ]}
        />

        <Checklist
          title="Before approving a new admin"
          items={[
            "Their statement is specific, not generic",
            "Tone is mature, respectful, on-topic",
            "No conspiracy-flavored or alarmist language",
            "Their stated contribution makes sense for HantaVirusTrack",
          ]}
        />

        <p
          style={{
            marginTop:   40,
            paddingTop:  24,
            borderTop:   "1px solid var(--border-subtle)",
            fontSize:    12,
            color:       "var(--text-tertiary)",
          }}
        >
          When in doubt, contact{" "}
          <a href="mailto:bafagihomar260@gmail.com" style={{ color: "var(--accent)" }}>
            bafagihomar260@gmail.com
          </a>
          .
        </p>
      </section>
      <SiteFooter />
    </>
  );
}

const codeStyle: React.CSSProperties = {
  padding:    "1px 5px",
  borderRadius: 4,
  background: "var(--bg-overlay)",
  fontSize:   12,
  fontFamily: "var(--font-mono)",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="t-h2"
      style={{ marginTop: 36, marginBottom: 12, color: "var(--text-primary)" }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize:   14,
        fontWeight: 600,
        marginTop:  20,
        marginBottom: 6,
        color:      "var(--text-primary)",
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize:    14,
        lineHeight:  "22px",
        color:       "var(--text-secondary)",
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        paddingLeft: 18,
        margin:      "0 0 12px 0",
        display:     "flex",
        flexDirection: "column",
        gap:         6,
        fontSize:    14,
        lineHeight:  "22px",
        color:       "var(--text-secondary)",
      }}
    >
      {children}
    </ul>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warn";
  children: React.ReactNode;
}) {
  const palette = tone === "warn"
    ? { bg: "rgba(255,184,77,0.08)", border: "rgba(255,184,77,0.32)" }
    : { bg: "rgba(91,192,235,0.08)", border: "rgba(91,192,235,0.32)" };
  return (
    <div
      style={{
        padding:      "12px 14px",
        marginTop:    8,
        marginBottom: 16,
        borderRadius: 10,
        background:   palette.bg,
        border:       `1px solid ${palette.border}`,
        fontSize:     13,
        lineHeight:   "20px",
        color:        "var(--text-secondary)",
      }}
    >
      {children}
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        marginTop:    16,
        padding:      14,
        borderRadius: 10,
        background:   "var(--bg-surface)",
        border:       "1px solid var(--border-default)",
      }}
    >
      <div
        className="t-cap t-up"
        style={{ color: "var(--text-tertiary)", marginBottom: 8 }}
      >
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it) => (
          <li key={it} style={{ fontSize: 13, lineHeight: "20px", color: "var(--text-secondary)" }}>
            ☐ {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
