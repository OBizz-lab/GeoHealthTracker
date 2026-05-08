// =============================================================================
// HantaVirusTrack copy — canonical source of strings (DESIGN_DOC)
// =============================================================================

export const brand = {
  name: "HantaVirusTrack",
  tagline: "Hantavirus surveillance, sourced and live",
  shortDescription:
    "Confirmed and suspected hantavirus cases from CDC, WHO, ECDC, PAHO, ProMED, and state health departments — on one map, updated every fifteen minutes.",
  domain: "hantavirustrack.org",
  email: "omar@hantavirustrack.org",
};

export const nav = {
  links: [
    { label: "Map",      href: "/map"      },
    { label: "Cases",    href: "/cases"    },
    { label: "Sources",  href: "/sources"  },
    { label: "About",    href: "/about"    },
    { label: "Pricing",  href: "/pricing"  },
  ],
  cta:    { label: "Subscribe →", href: "/pricing" },
  signIn: { label: "Sign in",     href: "/admin/queue" },
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
    title: "Custom alerts",
    description:
      "Watch zones around regions you care about. Email, SMS, and browser push.",
    icon: "BellRing",
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
  title:       "Get the weekly digest.",
  description: "Notable cases and source updates, every Monday. Free.",
  placeholder: "you@example.com",
  cta:         "Subscribe",
  success:     "Check your inbox to confirm.",
};

export const pricingTiers = [
  {
    id:    "free",
    name:  "Free",
    price: { monthly: "$0",     annual: "$0"      },
    save:  null,
    description: "Live map, all published cases, weekly digest.",
    features: [
      "Full map access",
      "All published cases",
      "Weekly email digest",
      "Read-only",
    ],
    cta:  "Choose Free",
    href: "/map",
  },
  {
    id:    "watch",
    name:  "Watch",
    price: { monthly: "$7/mo",  annual: "$60/yr"  },
    save:  { monthly: null,     annual: "save $24" },
    description: "Geo-targeted alerts via email, SMS, and push.",
    features: [
      "Up to 5 watch zones",
      "Real-time alerts (email/SMS/push)",
      "Configurable thresholds",
      "Faster cadence (15 min)",
      "Full historical data + CSV",
    ],
    cta:  "Choose Watch",
    href: "/map",
    highlighted: true,
  },
  {
    id:    "pro",
    name:  "Pro",
    price: { monthly: "$99/mo", annual: "$990/yr" },
    save:  { monthly: null,     annual: "save $198" },
    description: "API, embeds, and raw exports for institutions.",
    features: [
      "Everything in Watch",
      "API access (rate-limited)",
      "Embed widgets",
      "Raw data exports",
      "Priority support",
    ],
    cta:  "Choose Pro",
    href: "mailto:omar@hantavirustrack.org",
  },
];

export const faqItems = [
  {
    q: "Where does the data come from?",
    a: "Every case originates from an official health agency or surveillance feed: CDC NNDSS, WHO DON, ECDC, PAHO, ProMED-mail, and US state health departments. Each case has a direct link back to its source.",
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
    a: "No. HantaVirusTrack is a surveillance tool. For medical guidance, contact your local health authority.",
  },
  {
    q: "Can I integrate this into my own product?",
    a: "Yes — Pro tier exposes a REST API and embed widgets. See the API docs.",
  },
];

export const about = {
  eyebrow: "About",
  title:   "Surveillance, not opinion.",
  intro:
    "HantaVirusTrack aggregates confirmed and suspected hantavirus cases from official health agencies and renders them on a live, source-linked map. Every case has a citation. Every case is human-reviewed before publish.",
  sections: [
    {
      heading: "Methodology",
      body:
        "Per-source parsers normalize incoming reports into a canonical case shape, deduplicate on stable IDs or content hashes, and queue them for a moderator. Cases without confirmed coordinates are flagged for manual location entry. Source health is monitored continuously and surfaced to users.",
    },
    {
      heading: "Built by",
      body:
        "Omar — independent operator. Reach out at omar@hantavirustrack.org.",
    },
  ],
  disclaimerHeading: "Not medical advice",
  disclaimerBody:
    "This site is a surveillance tool. For medical guidance, contact your local health authority.",
};

export const sourcesPage = {
  eyebrow: "Data sources",
  title:   "Where every case comes from.",
  intro:
    "We only pull from official agencies and well-established public-health surveillance feeds. Source health is shown live; if a feed is degraded, we flag it.",
  methodologyHeading: "How we review",
  methodologyBody:
    "Each ingested record is normalized, deduplicated, and queued for a human moderator. Bad data stays out of the public map. Source health is recomputed every cron tick.",
};

export const disclaimer = {
  short: "Not medical advice.",
  long:
    "HantaVirusTrack is a surveillance tool. For medical guidance, contact your local health authority. Reports may be incomplete, delayed, or revised as situations evolve.",
};

export const footer = {
  columns: [
    {
      heading: "Product",
      links: [
        { label: "Live map", href: "/map"     },
        { label: "Cases",    href: "/cases"   },
        { label: "Pricing",  href: "/pricing" },
        { label: "API",      href: "/about"   },
      ],
    },
    {
      heading: "Data",
      links: [
        { label: "Sources",      href: "/sources" },
        { label: "Methodology",  href: "/about"   },
        { label: "Disclaimer",   href: "/about"   },
        { label: "Status",       href: "/sources" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About",   href: "/about"   },
        { label: "Contact", href: "mailto:omar@hantavirustrack.org" },
        { label: "Privacy", href: "/about"   },
        { label: "Terms",   href: "/about"   },
      ],
    },
  ],
  caption:
    "Data aggregated from CDC NNDSS, ProMED-mail, WHO DON, ECDC, PAHO, and state health departments. Not medical advice.",
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
