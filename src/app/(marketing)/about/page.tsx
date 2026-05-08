import { AlertTriangle } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { about } from "@/lib/copy";

export const metadata = {
  title: "About — HantaVirusTrack",
  description: about.intro,
};

export default function AboutPage() {
  return (
    <>
      <section
        style={{
          padding:   "80px 64px",
          maxWidth:  800,
          margin:    "0 auto",
          width:     "100%",
        }}
      >
        <div
          className="t-cap t-up"
          style={{ color: "var(--text-secondary)" }}
        >
          {about.eyebrow}
        </div>
        <h1
          className="t-display"
          style={{ margin: "12px 0 24px", color: "var(--text-primary)" }}
        >
          {about.title}
        </h1>
        <p
          style={{
            fontSize:    16,
            lineHeight:  "26px",
            color:       "var(--text-secondary)",
          }}
        >
          {about.intro}
        </p>

        {about.sections.map((s) => (
          <div key={s.heading}>
            <h2
              className="t-h2"
              style={{
                marginTop:    56,
                marginBottom: 12,
                color:        "var(--text-primary)",
              }}
            >
              {s.heading}
            </h2>
            <p
              style={{
                fontSize:    14,
                lineHeight:  "24px",
                color:       "var(--text-secondary)",
              }}
            >
              {s.body}
            </p>
          </div>
        ))}

        {/* Disclaimer card */}
        <div
          style={{
            marginTop:    56,
            padding:      20,
            borderRadius: 8,
            background:   "rgba(255,184,77,0.04)",
            border:       "1px solid var(--status-suspected)",
          }}
        >
          <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <AlertTriangle
              className="h-4 w-4"
              style={{ color: "var(--status-suspected)" }}
            />
            <div className="t-label" style={{ color: "var(--text-primary)" }}>
              {about.disclaimerHeading}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {about.disclaimerBody}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
