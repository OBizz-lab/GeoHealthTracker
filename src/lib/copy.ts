// =============================================================================
// HantaVirusTrack copy — canonical source of strings
// Free-only edition per FREE_MIGRATION.md (authoritative).
// =============================================================================

export const brand = {
  name: "HantaVirusTrack",
  tagline: "Hantavirus surveillance, sourced and live",
  shortDescription:
    "Confirmed and suspected hantavirus cases from CDC, WHO, ECDC, PAHO, ProMED, and state health departments — on one map, updated every fifteen minutes.",
  domain: "hantavirustrack.org",
  /** Project's only contact channel. We deliberately don't publish an email. */
  contactUrl:   "https://www.reddit.com/user/Ob344/",
  contactLabel: "u/Ob344 on Reddit",
};

export const nav = {
  links: [
    { label: "Map",      href: "/map"      },
    { label: "Cases",    href: "/cases"    },
    { label: "Symptoms", href: "/symptoms" },
    { label: "Sources",  href: "/sources"  },
    { label: "About",    href: "/about"    },
    { label: "Support",  href: "/support"  },
  ],
  // CTA → admin signup. Approved admins can add and confirm cases per the
  // contributor flow.
  cta:    { label: "Sign up free", href: "/admin/sign-up" },
  signIn: { label: "Sign in",      href: "/admin/sign-in" },
};

export const hero = {
  badge:    "Live · 9 sources · 1,247 cases tracked",
  title:    "Hantavirus surveillance, sourced and live.",
  subtitle:
    "Confirmed and suspected hantavirus cases from CDC, WHO, ECDC, PAHO, ProMED, and state health departments — on one map, updated every fifteen minutes.",
  ctaPrimary:   { label: "View live map →",     href: "/map" },
  ctaSecondary: { label: "How we source data",  href: "/sources" },
};

export const statsBand = [
  { label: "Cases tracked",     value: "1,247"   },
  { label: "Sources monitored", value: "9"       },
  { label: "Countries covered", value: "14"      },
  { label: "Last updated",      value: "12m ago" },
];

export const features = [
  {
    title: "Live map",
    description:
      "Every published case as a marker. Cluster, filter, and zoom across continents.",
    icon: "Globe2",
  },
  {
    title: "Verified sources",
    description:
      "Official health agencies only. Each case links back to its source. Human moderation before publish.",
    icon: "FlaskConical",
  },
  {
    title: "Free for everyone",
    description:
      "No paid tiers, no ads, no data sales. Donations on Buy Me a Coffee keep the lights on.",
    icon: "Coffee",
  },
];

export const howItWorks = [
  { n: "01", title: "Sources",    description: "CDC, WHO, ECDC, PAHO, ProMED, and state DOHs polled on cadence." },
  { n: "02", title: "Normalize",  description: "Per-source parsers map raw entries to a canonical case shape." },
  { n: "03", title: "Verify",     description: "Every case enters a moderation queue. A human approves before publish." },
  { n: "04", title: "Publish",    description: "Live on the map within minutes of verification." },
];

export const sourcesStrip = [
  "CDC NNDSS", "WHO DON", "ECDC", "PAHO", "ProMED",
  "NM DOH", "AZ DHS", "CO DPHE", "UT DOH",
];

export const newsletter = {
  title:        "Get the weekly digest.",
  description:  "Notable cases and source updates, every Monday. Free.",
  placeholder:  "you@example.com",
  cta:          "Subscribe",
  success:      "Check your inbox to confirm.",
  // CASL — Canada's Anti-Spam Legislation requires unticked express consent.
  // FREE_MIGRATION.md §9.
  consentLabel:
    "I consent to receive the weekly HantaVirusTrack newsletter by email. I can unsubscribe at any time using the link in every message.",
  caslFooter:
    "Sent by Omar Bafagih, doing business as HantaVirusTrack — [mailing address]. Unsubscribe link in every message. Free of charge to receive.",
};

// FAQ on the marketing landing page (short-form). Long-form FAQ lives on
// /about under aboutFaq in lib/legal-content.ts.
export const faqItems = [
  {
    q: "Where does the data come from?",
    a: "Every case originates from an official health agency or surveillance feed: CDC NNDSS, WHO DON, ECDC, PAHO, ProMED-mail, and US state health departments — plus community submissions backed by verifiable source URLs. Each case has a direct link back to its source.",
  },
  {
    q: "Are cases manually verified?",
    a: "Yes. Automated fetchers parse and normalize incoming reports, but every case enters a moderation queue and a human approves it before it appears on the public map.",
  },
  {
    q: "How often is data updated?",
    a: "Fast-cadence sources (ProMED, state DOHs) every 15 minutes. CDC, ECDC, and PAHO daily. WHO and aggregate sources daily.",
  },
  {
    q: "Is this medical advice?",
    a: "No. HantaVirusTrack is a surveillance tool. For medical guidance, contact your local health authority. See the full Disclaimer for details.",
  },
  {
    q: "Is HantaVirusTrack free?",
    a: "Yes — completely free for everyone. No paid tiers, no ads, no data sales. If you find it useful, you can leave a tip on the Support page.",
  },
  {
    q: "How do you count cases vs. deaths?",
    a: "Each case row records both a total case count and a fatality count, where fatalities are a subset of cases — never a separate addend. We never sum the two together. Every count change is logged with its source URL and the moderator who approved it.",
  },
];

// Legacy short export retained for the /sources page that still consumes it.
export const sourcesPage = {
  eyebrow: "Data sources",
  title:   "Where every case comes from.",
  intro:
    "We only pull from official agencies and well-established public-health surveillance feeds. Source health is shown live; if a feed is degraded, we flag it.",
  methodologyHeading: "How we review",
  methodologyBody:
    "Each ingested record is normalized, deduplicated, and queued for a human moderator. Bad data stays out of the public map. Source health is recomputed every cron tick.",
};

// Tiny copy bundle used by the case-drawer and other surfaces.
export const disclaimer = {
  short: "Not medical advice.",
  long:
    "HantaVirusTrack is a surveillance tool. For medical guidance, contact your local health authority. Reports may be incomplete, delayed, or revised as situations evolve.",
};

// /support page copy — FREE_MIGRATION.md §5.
export const supportPage = {
  eyebrow: "Support",
  title:   "HantaVirusTrack is free for everyone.",
  intro:
    "If it's been useful to you and you'd like to support the project, you can leave a tip via Buy Me a Coffee. There's no recurring commitment, donations are completely optional, and the site never paywalls features, runs ads, or sells data.",
  bmcHeading: "Buy me a coffee",
  bmcMissing:
    "The Buy Me a Coffee handle hasn't been configured yet. Once it is, the embed will appear here.",
  bmcFallback: "Visit Buy Me a Coffee to support directly →",
  fundsHeading: "What your tip funds",
  fundsBody:
    "Infrastructure (Mapbox tiles, Vercel hosting, Supabase, Resend email, domain renewal, occasional SMS costs) and time spent moderating submissions and tuning data sources. We'll publish an annual cost-vs-donations report after the first year.",
  taxHeading: "Important",
  taxBody:
    "Donations are not tax-deductible. HantaVirusTrack is operated by an individual, not a registered charity, and donations cannot be claimed as charitable contributions on your tax return. Buy Me a Coffee handles all payment processing on its side; we don't see your card details.",
  helpHeading: "Other ways to help",
};

export const footer = {
  columns: [
    {
      heading: "Product",
      links: [
        { label: "Live map", href: "/map"     },
        { label: "Cases",    href: "/cases"   },
        { label: "Sources",  href: "/sources" },
        { label: "Support",  href: "/support" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About",       href: "/about"             },
        { label: "Methodology", href: "/about#methodology" },
        { label: "FAQ",         href: "/about#faq"         },
        { label: "Contact",     href: "/about#contact"     },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Disclaimer", href: "/about#disclaimer" },
        { label: "Terms",      href: "/about#terms"      },
        { label: "Privacy",    href: "/about#privacy"    },
      ],
    },
  ],
  caption:
    "Data aggregated from CDC NNDSS, ProMED-mail, WHO DON, ECDC, PAHO, and state health departments. Not medical advice.",
  // CASL + tax disclosure on every page footer per FREE_MIGRATION §3 / §5.
  legalStrip:
    "Donations are not tax-deductible. HantaVirusTrack is not a registered charity.",
};

export const map = {
  title: "Live hantavirus map",
  legend: "Legend",
  selectPrompt: "Select a marker to see case details.",
  noToken:
    "Map preview unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to enable the interactive map.",
  loading: "Loading cases…",
};

// =============================================================================
// Live Signal — copy strings (SOCIAL_INTEGRATION §3.7)
// =============================================================================
export const signalCopy = {
  section_label:        "Live signal",
  tab_news:             "Official news",
  tab_reddit:           "Reddit chatter",
  tab_reddit_chip:      "UNVERIFIED",
  empty_news_title:     "No major news in the last 14 days.",
  empty_news_body:      "We'll surface stories from the whitelist as they publish.",
  empty_reddit_title:   "No new Reddit comments yet.",
  empty_reddit_body:
    "We'll surface top comments from the r/ContagionCuriosity 2026 hantavirus megathread as they post.",
  error_title:          "Couldn't load this feed.",
  error_body:           "Try again in a few minutes. The map data is unaffected.",
  error_retry_label:    "Retry",
  rate_limited_title:   "We're catching up.",
  rate_limited_body:    "This feed will refresh shortly.",
  disclaimer_news:
    "Headlines from major newsrooms. We link directly to the publisher; we do not host or modify article content.",
  disclaimer_reddit:
    "Comments shown are unverified user posts from a public Reddit megathread, ranked by upvotes and recency. Inclusion does not imply accuracy or endorsement. Verified case data is on the map.",
  expand_aria:          "Expand live signal",
  collapse_aria:        "Collapse live signal",
};
