import { SiteFooter } from "@/components/layout/site-footer";
import { AboutFaqAccordion } from "@/components/marketing/about-faq-accordion";
import { AboutTOC } from "@/components/marketing/about-toc";
import {
  contactContent,
  disclaimerContent,
  methodologyContent,
  overviewContent,
  privacyContent,
  termsContent,
  PLACEHOLDERS,
} from "@/lib/legal-content";

export const metadata = {
  title: "About — HantaVirusTrack",
  description:
    "HantaVirusTrack is an independent, free, live tracker for hantavirus cases worldwide. Methodology, FAQ, Disclaimer, Terms, Privacy, Contact.",
};

const SECTIONS = [
  { id: "overview",    label: "Overview"    },
  { id: "methodology", label: "Methodology" },
  { id: "faq",         label: "FAQ"         },
  { id: "disclaimer",  label: "Disclaimer"  },
  { id: "terms",       label: "Terms"       },
  { id: "privacy",     label: "Privacy"     },
  { id: "contact",     label: "Contact"     },
];

// Generic block renderer for the sectioned legal blocks
type LegalSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
  tail?: string[];
};

function LegalBlock({ section }: { section: LegalSection }) {
  return (
    <div style={{ marginTop: 28 }}>
      <h3
        className="t-h3"
        style={{ marginBottom: 8, color: "var(--text-primary)" }}
      >
        {section.heading}
      </h3>
      {section.paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 14,
            lineHeight: "24px",
            color: "var(--text-secondary)",
            marginBottom: 10,
          }}
        >
          {p}
        </p>
      ))}
      {section.list && (
        <ul
          style={{
            margin: "0 0 10px 0",
            paddingLeft: 20,
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: "22px",
          }}
        >
          {section.list.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      )}
      {section.tail?.map((p, i) => (
        <p
          key={`t-${i}`}
          style={{
            fontSize: 14,
            lineHeight: "24px",
            color: "var(--text-secondary)",
            marginBottom: 10,
          }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <section
        style={{
          padding: "64px 32px 96px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div className="t-cap t-up" style={{ color: "var(--text-secondary)" }}>
          About
        </div>
        <h1
          className="t-display"
          style={{ margin: "12px 0 32px", color: "var(--text-primary)", maxWidth: 720 }}
        >
          A live, source-linked map of hantavirus worldwide.
        </h1>

        <div
          className="grid gap-12"
          style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
        >
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
            <article style={{ maxWidth: 760 }}>
              {/* Overview */}
              <section id="overview" style={{ scrollMarginTop: 80 }}>
                <h2 className="t-h1" style={{ color: "var(--text-primary)" }}>
                  {overviewContent.heading}
                </h2>
                {overviewContent.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 16,
                      lineHeight: "26px",
                      color: "var(--text-secondary)",
                      marginTop: 16,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </section>

              {/* Methodology */}
              <section
                id="methodology"
                style={{ scrollMarginTop: 80, marginTop: 80 }}
              >
                <h2 className="t-h1" style={{ color: "var(--text-primary)" }}>
                  {methodologyContent.heading}
                </h2>
                {methodologyContent.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 14,
                      lineHeight: "24px",
                      color: "var(--text-secondary)",
                      marginTop: 12,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </section>

              {/* FAQ */}
              <section
                id="faq"
                style={{ scrollMarginTop: 80, marginTop: 80 }}
              >
                <h2 className="t-h1" style={{ color: "var(--text-primary)", marginBottom: 16 }}>
                  Frequently asked questions
                </h2>
                <AboutFaqAccordion />
              </section>

              {/* Disclaimer */}
              <section
                id="disclaimer"
                style={{ scrollMarginTop: 80, marginTop: 80 }}
              >
                <h2 className="t-h1" style={{ color: "var(--text-primary)" }}>
                  Disclaimer
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 4,
                    marginBottom: 16,
                  }}
                >
                  Effective date: {disclaimerContent.effectiveDate}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: "24px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {disclaimerContent.intro}
                </p>
                {disclaimerContent.sections.map((s) => (
                  <LegalBlock key={s.heading} section={s as LegalSection} />
                ))}
              </section>

              {/* Terms */}
              <section
                id="terms"
                style={{ scrollMarginTop: 80, marginTop: 80 }}
              >
                <h2 className="t-h1" style={{ color: "var(--text-primary)" }}>
                  Terms of Service
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 4,
                    marginBottom: 16,
                  }}
                >
                  Effective date: {termsContent.effectiveDate}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: "24px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {termsContent.intro}
                </p>
                {termsContent.sections.map((s) => (
                  <LegalBlock key={s.heading} section={s as LegalSection} />
                ))}
              </section>

              {/* Privacy */}
              <section
                id="privacy"
                style={{ scrollMarginTop: 80, marginTop: 80 }}
              >
                <h2 className="t-h1" style={{ color: "var(--text-primary)" }}>
                  Privacy
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 4,
                    marginBottom: 16,
                  }}
                >
                  Effective date: {privacyContent.effectiveDate}
                </div>
                {privacyContent.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 14,
                      lineHeight: "24px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {p}
                  </p>
                ))}
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 12,
                  }}
                >
                  Placeholder text. A fuller PIPEDA-aligned notice will replace
                  this before launch.
                </p>
              </section>

              {/* Contact */}
              <section
                id="contact"
                style={{ scrollMarginTop: 80, marginTop: 80 }}
              >
                <h2 className="t-h1" style={{ color: "var(--text-primary)" }}>
                  Contact
                </h2>
                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "max-content 1fr",
                    columnGap: 24,
                    rowGap: 8,
                    fontSize: 14,
                    color: "var(--text-secondary)",
                  }}
                >
                  {contactContent.rows.map((row) => (
                    <div key={row.label} style={{ display: "contents" }}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.label}
                      </div>
                      <div>{row.value}</div>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 16,
                  }}
                >
                  Bracketed values like {PLACEHOLDERS.contactEmail} are
                  placeholders to be replaced before launch.
                </p>
              </section>
            </article>

            {/* Sticky TOC — desktop only */}
            <aside className="hidden lg:block" style={{ position: "relative" }}>
              <AboutTOC sections={SECTIONS} />
            </aside>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
