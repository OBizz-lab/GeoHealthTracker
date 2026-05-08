import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "Symptoms — HantaVirusTrack",
  description:
    "Hantavirus symptoms summarized from CDC, WHO, and ECDC. Not medical advice — see your local health authority for guidance.",
};

// =============================================================================
// /symptoms — public information page.
// Content drawn from CDC, WHO, and ECDC. Every clinical claim hyperlinks to
// its primary source. Not medical advice; the disclaimer at the top is
// load-bearing.
// =============================================================================

interface Source {
  label: string;
  url:   string;
}

const SOURCES: Record<string, Source> = {
  cdcHpsSymptoms: {
    label: "CDC — HPS symptoms, diagnosis, and treatment",
    url:   "https://www.cdc.gov/hantavirus/symptoms-diagnosis-treatment/",
  },
  cdcHpsAbout: {
    label: "CDC — About hantavirus pulmonary syndrome",
    url:   "https://www.cdc.gov/hantavirus/about/",
  },
  cdcHfrs: {
    label: "CDC — Hemorrhagic Fever with Renal Syndrome (HFRS)",
    url:   "https://www.cdc.gov/hantavirus/hfrs/",
  },
  ecdcFactsheet: {
    label: "ECDC — Hantavirus infection factsheet",
    url:   "https://www.ecdc.europa.eu/en/hantavirus-infection/facts",
  },
  whoHantavirus: {
    label: "WHO — Hantavirus topic page",
    url:   "https://www.who.int/health-topics/hantavirus-disease",
  },
};

function Cite({ source }: { source: Source }) {
  return (
    <sup>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        title={source.label}
        style={{
          fontSize:   10,
          fontWeight: 600,
          padding:    "1px 5px",
          marginLeft: 3,
          borderRadius: 4,
          background: "var(--bg-overlay)",
          color:      "var(--accent)",
          textDecoration: "none",
        }}
      >
        ↗
      </a>
    </sup>
  );
}

export default function SymptomsPage() {
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
          Hantavirus symptoms
        </h1>
        <p
          style={{
            fontSize:    15,
            lineHeight:  "24px",
            marginBottom: 24,
            color:       "var(--text-secondary)",
          }}
        >
          A summary of hantavirus symptoms from official public-health sources.
          Every clinical claim below links back to its source. This page is for
          information only — it is <strong>not medical advice</strong>. If you
          believe you may have been exposed or are experiencing symptoms,
          contact your local health authority or a clinician.
        </p>

        <div
          role="note"
          style={{
            marginBottom: 32,
            padding:      "12px 14px",
            borderRadius: 10,
            border:       "1px solid var(--border-subtle)",
            background:   "var(--bg-surface)",
            fontSize:     13,
            lineHeight:   "20px",
            color:        "var(--text-secondary)",
          }}
        >
          <strong style={{ color: "var(--text-primary)" }}>Two clinical syndromes.</strong>{" "}
          Hantaviruses cause two distinct illnesses depending on the strain.{" "}
          <em>New World</em> hantaviruses (Sin Nombre, Andes, etc.) cause{" "}
          <strong>Hantavirus Pulmonary Syndrome (HPS)</strong> — primarily a lung
          disease. <em>Old World</em> hantaviruses (Hantaan, Seoul, Puumala,
          Dobrava-Belgrade) cause <strong>Hemorrhagic Fever with Renal Syndrome
          (HFRS)</strong> — primarily a kidney disease.
          <Cite source={SOURCES.cdcHpsAbout} />
          <Cite source={SOURCES.ecdcFactsheet} />
        </div>

        {/* HPS section */}
        <Section
          eyebrow="New World hantaviruses"
          title="Hantavirus Pulmonary Syndrome (HPS)"
          incubation="1 to 5 weeks after exposure (typically 2–3 weeks)."
          incubationCite={SOURCES.cdcHpsSymptoms}
        >
          <Phase
            label="Early phase (first 1–5 days of illness)"
            items={[
              { text: "Fever",                                    cite: SOURCES.cdcHpsSymptoms },
              { text: "Severe muscle aches in the thighs, hips, back, and sometimes shoulders", cite: SOURCES.cdcHpsSymptoms },
              { text: "Fatigue",                                  cite: SOURCES.cdcHpsSymptoms },
              { text: "Headaches, dizziness, chills",             cite: SOURCES.cdcHpsSymptoms },
              { text: "Abdominal symptoms (nausea, vomiting, diarrhea, abdominal pain)", cite: SOURCES.cdcHpsSymptoms },
            ]}
          />
          <Phase
            label="Late phase (4–10 days after early symptoms)"
            items={[
              { text: "Coughing and shortness of breath as lungs fill with fluid", cite: SOURCES.cdcHpsSymptoms },
              { text: "Low blood pressure and decreased heart efficiency",         cite: SOURCES.cdcHpsSymptoms },
              { text: "Rapid progression — HPS is a medical emergency once respiratory symptoms appear", cite: SOURCES.cdcHpsAbout },
            ]}
          />
          <p
            style={{
              fontSize:   13,
              lineHeight: "20px",
              marginTop:  16,
              padding:    "10px 12px",
              borderRadius: 8,
              background: "rgba(201,42,79,0.08)",
              border:     "1px solid rgba(201,42,79,0.30)",
              color:      "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--status-fatal)" }}>Mortality:</strong>{" "}
            HPS has a case-fatality rate of approximately <strong>38%</strong>.
            Early medical care in an intensive-care setting improves survival.
            <Cite source={SOURCES.cdcHpsAbout} />
          </p>
        </Section>

        {/* HFRS section */}
        <Section
          eyebrow="Old World hantaviruses"
          title="Hemorrhagic Fever with Renal Syndrome (HFRS)"
          incubation="1 to 8 weeks after exposure (typically 2–4 weeks)."
          incubationCite={SOURCES.cdcHfrs}
        >
          <Phase
            label="Initial symptoms"
            items={[
              { text: "Intense headache, back and abdominal pain",     cite: SOURCES.cdcHfrs },
              { text: "Fever, chills",                                  cite: SOURCES.cdcHfrs },
              { text: "Nausea and vomiting",                            cite: SOURCES.cdcHfrs },
              { text: "Blurred vision",                                 cite: SOURCES.cdcHfrs },
              { text: "Flushing of the face, eye redness, or a rash",   cite: SOURCES.cdcHfrs },
            ]}
          />
          <Phase
            label="Later symptoms"
            items={[
              { text: "Low blood pressure",                             cite: SOURCES.cdcHfrs },
              { text: "Acute shock and vascular leakage",               cite: SOURCES.cdcHfrs },
              { text: "Acute kidney failure — can cause severe fluid overload", cite: SOURCES.cdcHfrs },
              { text: "Hemorrhagic manifestations in severe cases",     cite: SOURCES.cdcHfrs },
            ]}
          />
          <p
            style={{
              fontSize:   13,
              lineHeight: "20px",
              marginTop:  16,
              padding:    "10px 12px",
              borderRadius: 8,
              background: "rgba(255,184,77,0.08)",
              border:     "1px solid rgba(255,184,77,0.30)",
              color:      "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--status-suspected)" }}>Mortality:</strong>{" "}
            Mortality varies by strain — Hantaan and Dobrava can reach{" "}
            <strong>5–15%</strong>, while Puumala typically causes a milder
            illness with mortality under <strong>1%</strong>.
            <Cite source={SOURCES.cdcHfrs} />
            <Cite source={SOURCES.ecdcFactsheet} />
          </p>
        </Section>

        {/* When to seek care */}
        <h2
          className="t-h2"
          style={{ marginTop: 40, marginBottom: 12, color: "var(--text-primary)" }}
        >
          When to seek medical care
        </h2>
        <p
          style={{
            fontSize:    14,
            lineHeight:  "22px",
            color:       "var(--text-secondary)",
            marginBottom: 16,
          }}
        >
          If you have been exposed to rodents or rodent droppings — or, in the
          context of a known cluster, in close contact with a confirmed case —
          and you develop fever, severe muscle aches, or shortness of breath,
          contact a healthcare provider promptly and tell them about the
          exposure. Early diagnosis and supportive care meaningfully improve
          outcomes for both HPS and HFRS.
          <Cite source={SOURCES.cdcHpsSymptoms} />
        </p>

        {/* Sources block */}
        <h2
          className="t-h2"
          style={{ marginTop: 40, marginBottom: 12, color: "var(--text-primary)" }}
        >
          Sources
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding:   0,
            margin:    0,
            display:   "flex",
            flexDirection: "column",
            gap:       8,
          }}
        >
          {Object.values(SOURCES).map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize:    13,
                  color:       "var(--accent)",
                  textDecoration: "none",
                }}
              >
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>

        <p
          style={{
            marginTop:   32,
            paddingTop:  24,
            borderTop:   "1px solid var(--border-subtle)",
            fontSize:    12,
            lineHeight:  "18px",
            color:       "var(--text-tertiary)",
          }}
        >
          This page is a summary of public information from CDC, ECDC, and WHO
          for educational purposes. It is not a substitute for medical advice.
          See our{" "}
          <Link href="/legal/disclaimer" style={{ color: "var(--accent)" }}>
            full disclaimer
          </Link>
          .
        </p>
      </section>
      <SiteFooter />
    </>
  );
}

function Section({
  eyebrow,
  title,
  incubation,
  incubationCite,
  children,
}: {
  eyebrow:        string;
  title:          string;
  incubation:     string;
  incubationCite: Source;
  children:       React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 40 }}>
      <div
        className="t-cap t-up"
        style={{ color: "var(--text-tertiary)", marginBottom: 6 }}
      >
        {eyebrow}
      </div>
      <h2 className="t-h2" style={{ color: "var(--text-primary)", marginBottom: 8 }}>
        {title}
      </h2>
      <p
        style={{
          fontSize:    13,
          lineHeight:  "20px",
          color:       "var(--text-secondary)",
          marginBottom: 16,
        }}
      >
        <strong style={{ color: "var(--text-primary)" }}>Incubation:</strong>{" "}
        {incubation}
        <Cite source={incubationCite} />
      </p>
      {children}
    </section>
  );
}

function Phase({
  label,
  items,
}: {
  label: string;
  items: { text: string; cite: Source }[];
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        className="t-cap t-up"
        style={{ color: "var(--text-tertiary)", marginBottom: 8 }}
      >
        {label}
      </div>
      <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it) => (
          <li
            key={it.text}
            style={{
              fontSize:    14,
              lineHeight:  "22px",
              color:       "var(--text-secondary)",
            }}
          >
            {it.text}
            <Cite source={it.cite} />
          </li>
        ))}
      </ul>
    </div>
  );
}
