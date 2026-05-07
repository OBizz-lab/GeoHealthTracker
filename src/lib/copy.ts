export const brand = {
  name: "GeoHealthTracker",
  tagline: "Real-time global health intelligence on a single map",
  shortDescription:
    "Track emerging public health signals across regions with verified, timestamped data.",
};

export const nav = {
  links: [
    { label: "Live Map", href: "/map" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
  ],
  cta: { label: "Open Map", href: "/map" },
};

export const hero = {
  eyebrow: "Public health visualization",
  title: "See where it's happening, before it spreads",
  subtitle:
    "GeoHealthTracker aggregates verified reports from health agencies, peer-reviewed sources, and on-the-ground partners onto an interactive map you can explore in seconds.",
  ctaPrimary: { label: "Explore the live map", href: "/map" },
  ctaSecondary: { label: "How it works", href: "/about" },
};

export const stats = [
  { label: "Active reports", value: "2,847" },
  { label: "Countries covered", value: "94" },
  { label: "Verified sources", value: "312" },
  { label: "Updates per day", value: "1.2K" },
];

export const features = [
  {
    title: "Interactive global map",
    description:
      "Pan, zoom, and filter through reports with smooth Mapbox rendering. Color-coded markers show status at a glance.",
    icon: "Globe2",
  },
  {
    title: "Verified sourcing",
    description:
      "Every data point links back to a primary source — government bulletin, peer-reviewed publication, or vetted partner.",
    icon: "ShieldCheck",
  },
  {
    title: "Watch zones & alerts",
    description:
      "Draw a region of interest. Get email notifications when new reports surface within it.",
    icon: "BellRing",
  },
  {
    title: "Historical timeline",
    description:
      "Scrub through time to see how clusters emerge, peak, and resolve. Export windows for further analysis.",
    icon: "Clock",
  },
  {
    title: "Open API",
    description:
      "Pull the same data into your own dashboards, research notebooks, or operational tools via a REST endpoint.",
    icon: "Code2",
  },
  {
    title: "Privacy-respecting",
    description:
      "We aggregate location-level signals only. No personal data, no patient information, no surveillance.",
    icon: "Lock",
  },
];

export const newsletter = {
  title: "Weekly briefing in your inbox",
  description:
    "A short, ad-free summary of notable health signals from the past week. Unsubscribe anytime.",
  placeholder: "you@example.com",
  cta: "Subscribe",
  success: "Thanks — check your inbox to confirm.",
};

export const pricingTiers = [
  {
    name: "Public",
    price: "Free",
    description: "For curious citizens, journalists, and students.",
    features: [
      "Full live map access",
      "Public report archive",
      "Weekly newsletter",
      "Read-only API (60 req/hr)",
    ],
    cta: "Get started",
    href: "/map",
  },
  {
    name: "Researcher",
    price: "$24/mo",
    description: "For academics, NGOs, and independent researchers.",
    features: [
      "Everything in Public",
      "Historical timeline export",
      "10 watch zones with alerts",
      "API: 1,000 req/hr",
      "Citation-ready data exports",
    ],
    cta: "Start trial",
    href: "/pricing",
    highlighted: true,
  },
  {
    name: "Operations",
    price: "Contact us",
    description:
      "For health agencies, response teams, and enterprise platforms.",
    features: [
      "Everything in Researcher",
      "Unlimited watch zones",
      "Webhook + Slack integrations",
      "Custom data feeds",
      "SLA + dedicated support",
    ],
    cta: "Talk to us",
    href: "mailto:hello@geohealthtracker.example",
  },
];

export const about = {
  title: "About GeoHealthTracker",
  intro:
    "GeoHealthTracker is an independent project that visualizes publicly reported health signals on a single, navigable map. We don't break news — we consolidate signals already in the public record and make them easier to see in context.",
  sections: [
    {
      heading: "Methodology",
      body: "Our pipeline ingests bulletins from national and regional health agencies, peer-reviewed alerts, and a curated set of partner organizations. Each report is enriched with geocoded coordinates, normalized status, and a link back to the originating source. We re-check sources daily and mark resolved entries when the source declares closure.",
    },
    {
      heading: "Sources",
      body: "We pull from WHO, ECDC, US CDC, regional ministries of health, ProMED, peer-reviewed journals, and other vetted partners. Source credibility scoring is published openly. We do not aggregate social media reports as primary signals.",
    },
    {
      heading: "What this is not",
      body: "GeoHealthTracker is an informational research tool. It is not a medical device, a diagnostic service, or a substitute for guidance from public health authorities. Reports may be incomplete, delayed, or revised as situations evolve.",
    },
    {
      heading: "Contact",
      body: "Press, partnerships, and corrections: hello@geohealthtracker.example",
    },
  ],
};

export const disclaimer = {
  short: "Informational only — not medical advice.",
  long: "GeoHealthTracker is an informational research tool aggregating public reports. It is not a medical device, diagnostic service, or substitute for guidance from qualified health professionals or public health authorities. Always consult primary sources and licensed clinicians for clinical decisions.",
};

export const footer = {
  columns: [
    {
      heading: "Product",
      links: [
        { label: "Live Map", href: "/map" },
        { label: "Pricing", href: "/pricing" },
        { label: "API", href: "/about" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Methodology", href: "/about" },
        { label: "Press", href: "/about" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Disclaimer", href: "/about" },
        { label: "Privacy", href: "/about" },
        { label: "Terms", href: "/about" },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} GeoHealthTracker. All rights reserved.`,
};

export const map = {
  title: "Live global health map",
  legend: "Report status",
  selectPrompt: "Select a marker to see report details.",
  noToken:
    "Map preview unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to enable the interactive map.",
  loading: "Loading map…",
};
