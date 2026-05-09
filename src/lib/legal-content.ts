// =============================================================================
// Legal content — verbatim text per FREE_MIGRATION.md §6 (Disclaimer) and §7
// (Terms of Service). Bracketed values are placeholders Omar will fill in.
// =============================================================================

// Single Reddit handle is the project's only contact channel — every
// legal/contact reference funnels through u/Ob344. We deliberately don't
// publish an email address.
export const REDDIT_CONTACT_URL = "https://www.reddit.com/user/Ob344/";
const REDDIT_CONTACT_LABEL      = "u/Ob344 on Reddit";

export const PLACEHOLDERS = {
  effectiveDate:    "[effective date]",
  contactEmail:     REDDIT_CONTACT_LABEL,
  securityEmail:    REDDIT_CONTACT_LABEL,
  pressEmail:       REDDIT_CONTACT_LABEL,
  correctionsEmail: REDDIT_CONTACT_LABEL,
  privacyEmail:     REDDIT_CONTACT_LABEL,
  mailingAddress:   REDDIT_CONTACT_LABEL,
  bmcHandle:        "omarbafagih",
} as const;

// -----------------------------------------------------------------------------
// Disclaimer — FREE_MIGRATION.md §6
// -----------------------------------------------------------------------------

export const disclaimerContent = {
  effectiveDate: PLACEHOLDERS.effectiveDate,
  intro:
    "Read this carefully. By using HantaVirusTrack you agree to this disclaimer. If you do not agree, please do not use the site.",
  sections: [
    {
      heading: "Not medical advice",
      paragraphs: [
        "HantaVirusTrack is an informational tool. Nothing on this site — case markers on the map, statistics, alerts, news headlines, community posts, community-submitted cases, or anything else — is medical advice, professional advice, or a substitute for consultation with a qualified healthcare professional, public health authority, or licensed medical provider.",
        "If you have symptoms consistent with hantavirus infection (fever, fatigue, muscle aches, headache, dizziness, abdominal pain, followed by shortness of breath in severe cases), or you believe you have been exposed to rodents, rodent droppings, or contaminated environments, contact your healthcare provider or your local public health authority immediately. Do not delay seeking care because of anything you read or see on HantaVirusTrack.",
        "If you are experiencing a medical emergency, call your local emergency number (911 in Canada and the United States) or go directly to the nearest emergency department.",
      ],
    },
    {
      heading: "No professional relationship",
      paragraphs: [
        "Use of HantaVirusTrack does not create any provider-patient, doctor-patient, lawyer-client, fiduciary, or other professional relationship between you and the operator of HantaVirusTrack.",
      ],
    },
    {
      heading: "Data accuracy",
      paragraphs: [
        "Case data on HantaVirusTrack is aggregated from third-party sources, including the United States Centers for Disease Control and Prevention (CDC), the World Health Organization (WHO), the European Centre for Disease Prevention and Control (ECDC), the Pan American Health Organization (PAHO), ProMED-mail, the Public Health Agency of Canada, individual state, provincial, and national health departments, and community submissions from individual users. We apply normalization, deduplication, and human moderation, but we make no representation or warranty regarding the accuracy, completeness, timeliness, currency, or reliability of any case data, statistic, news headline, community post, community submission, or any other content on the site.",
        "Case data may be delayed, incomplete, misclassified, misgeocoded, outdated, or otherwise incorrect. The absence of a case in a region on the map does not mean there are no cases in that region — it may mean we have not yet ingested or received that information, the source has not yet reported it, or the case is still in our moderation queue.",
        "Community submissions are reviewed by human moderators against a verifiable source URL, but moderators may make mistakes. We are not liable for inaccuracies in any case, including community-submitted cases that pass moderation.",
      ],
    },
    {
      heading: "Third-party content",
      paragraphs: [
        "News headlines and community posts displayed in the live signal feature are produced by third parties (newsrooms, social-media users on Bluesky, Reddit, Mastodon, and other platforms) and surfaced through automated aggregation. Inclusion does not constitute endorsement, verification, or recommendation. Community posts are explicitly marked UNVERIFIED and may contain inaccurate, misleading, or false information. You are responsible for evaluating the credibility of all third-party content. External links lead to websites operated by third parties; we do not control or take responsibility for them.",
      ],
    },
    {
      heading: "Watch alerts",
      paragraphs: [
        "The Watch zone feature offers free email and browser-push alerts (and SMS, when SMS is available) triggered by case publication within user-defined geographic zones. These alerts are not guaranteed to be delivered, are not a real-time emergency notification system, and are not a substitute for any official public-health alert, evacuation, or warning system. Alerts may be delayed, fail entirely, be misdirected, or be incomplete due to upstream data delays, moderation queue depth, third-party email or SMS provider outages, your device's notification settings, network conditions, or our own service interruptions. Do not rely on Watch alerts as your sole or primary means of being informed about disease activity in your area. Always consult official public-health authorities for actionable risk information.",
      ],
    },
    {
      heading: "Not for clinical, legal, or emergency use",
      paragraphs: [
        "HantaVirusTrack is not designed, intended, certified, validated, or authorized for use in clinical decision-making, medical diagnosis, patient triage, public-health emergency response, official surveillance, life-safety or critical infrastructure systems, legal proceedings as evidence of disease presence or absence, or underwriting, insurance, or actuarial analysis. If you intend to use HantaVirusTrack data for any of these purposes, you do so entirely at your own risk and you agree that the operator bears no responsibility for any decision, action, or outcome resulting from such use.",
      ],
    },
    {
      heading: "As-is, no warranty",
      paragraphs: [
        "HantaVirusTrack is provided AS IS and AS AVAILABLE, without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, accuracy, non-infringement, uninterrupted availability, security, or freedom from errors. The Service is provided at no cost; the warranties typically attached to paid consumer goods do not apply. Nothing in this disclaimer limits any liability that cannot lawfully be limited under applicable Canadian law.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by applicable law, in no event shall the operator of HantaVirusTrack, its contributors, moderators, or affiliates be liable to you or to any third party for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages — including damages for personal injury, illness, death, lost profits, lost data, business interruption, or emotional distress — arising out of or related to your use of, reliance on, or inability to use HantaVirusTrack, even if we have been advised of the possibility of such damages. The Terms of Service contain an enforceable cap on aggregate liability.",
      ],
    },
    {
      heading: "Acknowledgment",
      paragraphs: [
        "By using HantaVirusTrack, you acknowledge that you have read, understood, and agreed to this Disclaimer in full, and that you understand HantaVirusTrack is an informational reference tool only, not a substitute for qualified professional advice, medical care, or official public-health guidance.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [`Questions: ${PLACEHOLDERS.contactEmail}.`],
    },
  ],
};

// -----------------------------------------------------------------------------
// Terms of Service — FREE_MIGRATION.md §7
// -----------------------------------------------------------------------------

export const termsContent = {
  effectiveDate: PLACEHOLDERS.effectiveDate,
  intro:
    'These Terms of Service ("Terms") govern your access to and use of HantaVirusTrack at hantavirustrack.org (the "Service"), operated from Ontario, Canada by Omar Bafagih ("we", "us", "our", or the "operator"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.',
  sections: [
    {
      heading: "1. Eligibility",
      paragraphs: [
        "You must be at least 18 years old, or the age of majority in your jurisdiction (whichever is greater), to create an account, submit a case, or apply for researcher access. By using the Service you represent that you meet this requirement and that you have the legal capacity to enter into these Terms.",
      ],
    },
    {
      heading: "2. The Service",
      paragraphs: [
        'HantaVirusTrack is a free informational website that aggregates and displays publicly available data about hantavirus cases from third-party sources, augmented by community submissions backed by verifiable source URLs. The Service includes a public live map, case listing, statistics, a live news/social signal feed, free user accounts with custom geographic alert zones, a community case-submission feature, and an application-based "verified researcher" tier with elevated API rate limits. All features are free for all users. The Service is not a medical, emergency-response, or clinical decision-making tool. See the Disclaimer above.',
      ],
    },
    {
      heading: "3. Accounts",
      paragraphs: [
        `Public portions of the Service are usable without an account. Watch zones, case submissions, and researcher applications require an account. You agree to provide accurate information, keep your authentication credentials confidential, notify us promptly of unauthorized access at ${PLACEHOLDERS.securityEmail}, and accept responsibility for all activity under your account. We may suspend or terminate any account at any time, with or without notice, including for violation of these Terms.`,
      ],
    },
    {
      heading: "4. Donations (Buy Me a Coffee)",
      paragraphs: [
        `The Service is free. Donations are voluntary and processed by Buy Me a Coffee (buymeacoffee.com/${PLACEHOLDERS.bmcHandle}); we do not see card details. Donations are not tax-deductible — the operator is not a registered charity and donations cannot be claimed as charitable contributions. Donations are not consideration for any feature and do not unlock additional access. Buy Me a Coffee handles refund requests under its own terms; we do not process refunds.`,
      ],
    },
    {
      heading: "5. Acceptable use",
      paragraphs: ["You agree not to:"],
      list: [
        "(a) use the Service for any unlawful purpose;",
        "(b) scrape, crawl, or extract bulk data from the Service except via the public API within its documented rate limits, or via researcher-tier rate limits if approved;",
        "(c) reverse-engineer or attempt to derive source code from the Service;",
        "(d) interfere with, disrupt, or impose unreasonable load on the Service;",
        "(e) circumvent any rate limit, access control, or technical protection;",
        "(f) impersonate any person or misrepresent your affiliation, including in submissions or researcher applications;",
        "(g) submit community case reports without a verifiable source URL, or with a source you do not have a good-faith belief credibly reports the case;",
        "(h) coordinate to inject false data or harass identifiable individuals through submissions;",
        "(i) use Service data to make medical, clinical, emergency, life-safety, insurance, underwriting, or legal decisions; or",
        "(j) suggest endorsement by, or affiliation with, the operator or any of our data sources without express written permission.",
      ],
    },
    {
      heading: "6. Intellectual property",
      paragraphs: [
        `The Service software, design, our content, and the "HantaVirusTrack" wordmark are owned by the operator and protected by copyright, trademark, and other intellectual-property laws. We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service in accordance with these Terms. All rights not expressly granted are reserved. Third-party content surfaced through the Service (case data, news headlines, social posts) is owned by its respective rights-holders and is displayed under fair use, fair dealing, applicable license, or platform API terms. Copyright takedown notices: ${PLACEHOLDERS.contactEmail}.`,
      ],
    },
    {
      heading: "7. User content (submissions, applications, profile)",
      paragraphs: [
        'You may submit content to the Service, including community case submissions, researcher applications, profile information, watch zone names, and contact-form messages ("User Content"). You retain ownership of your User Content. You grant us a worldwide, royalty-free, non-exclusive license to host, store, process, modify (for normalization, deduplication, formatting, and editorial moderation), display, and distribute your User Content as part of the Service.',
        "You represent and warrant that:",
      ],
      list: [
        "(a) you have the right to grant the foregoing license;",
        "(b) your User Content does not infringe any third-party intellectual-property, privacy, publicity, or other right;",
        "(c) source URLs you submit are accurate, accessible, and credibly support the case details you submit;",
        "(d) you have read the source you cite and have a good-faith belief in the accuracy of what you submit;",
        "(e) you are not using the Service to harass, defame, or out any identifiable individual; and",
        "(f) your User Content otherwise complies with these Terms.",
      ],
      tail: [
        "If a community submission is approved by a moderator and published, your account's display name may be shown publicly as attribution, or the case may appear anonymously if no display name is set in your profile. You can update your display name at any time, which affects future approvals; published cases keep the attribution that was current at the time of approval unless you specifically request removal.",
      ],
    },
    {
      heading: "8. Moderation",
      paragraphs: [
        "All content that reaches the public map — automated and community-submitted — is reviewed by a human moderator. Moderators may approve, reject, edit, or delete any submission for any reason, including inability to verify the cited source, suspected duplicate, off-topic content, or violation of these Terms. Moderation is editorial and discretionary; we are not obliged to publish any specific submission.",
      ],
    },
    {
      heading: "9. API and embed access",
      paragraphs: [
        'The public API and basic embed widgets are free for all users, subject to documented rate limits (60 requests per minute, 10,000 per day for default access; 600 requests per minute and elevated quotas for approved researchers). If approved for researcher-tier access, you additionally agree to keep API keys confidential, comply with documented rate limits, display attribution ("Data: HantaVirusTrack — hantavirustrack.org") in any user-facing surface, not resell or redistribute raw Service data to third parties, not combine Service data into a product materially substitutable for the Service itself, and respect the terms of the original data sources where they flow through. We may revoke API keys, suspend embeds, or revoke researcher access for any violation.',
      ],
    },
    {
      heading: "10. Commercial electronic messages (CASL)",
      paragraphs: [
        "Where you have provided express or implied consent under Canada's Anti-Spam Legislation (CASL), we may send you commercial electronic messages relating to the Service. Every commercial message we send identifies us, includes our mailing address, and provides a free, immediate unsubscribe mechanism. Transactional messages directly tied to your account or actions (alert deliveries, submission status, security notices) are exempt under CASL and may continue even if you have unsubscribed from marketing.",
      ],
    },
    {
      heading: "11. Watch alerts",
      paragraphs: [
        "Watch alerts are best-effort and may fail. They are not a real-time emergency notification system. See the Disclaimer above. You acknowledge and agree that we are not liable for any damages arising from delayed, failed, missing, or inaccurate alerts.",
      ],
    },
    {
      heading: "12. Termination",
      paragraphs: [
        "You may terminate your account at any time via the Account → Danger zone page. We may terminate or suspend your account, with or without cause and with or without notice, including for violation of these Terms. On termination your right to use the Service ends immediately. Sections 6, 7, 9, 12 through 19 survive termination.",
      ],
    },
    {
      heading: "13. Disclaimer of warranties",
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, RELIABILITY, OR UNINTERRUPTED OR ERROR-FREE OPERATION. WITHOUT LIMITING THE FOREGOING, WE DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS, THAT CASE DATA (FROM ANY SOURCE) IS ACCURATE OR COMPLETE, OR THAT ALERTS WILL BE DELIVERED.',
        "NOTHING IN THESE TERMS LIMITS OR EXCLUDES ANY WARRANTY OR CONDITION THAT CANNOT BE LIMITED OR EXCLUDED UNDER APPLICABLE LAW.",
      ],
    },
    {
      heading: "14. Limitation of liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE OPERATOR, ITS CONTRIBUTORS, MODERATORS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES — INCLUDING DAMAGES FOR LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, PERSONAL INJURY, ILLNESS, DEATH, OR EMOTIONAL DISTRESS — ARISING OUT OF OR RELATED TO THE SERVICE, THESE TERMS, OR YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, AND REGARDLESS OF WHETHER THE CLAIM IS BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER THEORY.",
        "BECAUSE THE SERVICE IS PROVIDED AT NO COST AND YOU HAVE NOT PAID US ANY FEES, OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE SERVICE OR THESE TERMS SHALL NOT EXCEED ONE HUNDRED CANADIAN DOLLARS (CAD $100).",
        "NOTHING IN THIS SECTION LIMITS OR EXCLUDES ANY LIABILITY THAT CANNOT BE LAWFULLY LIMITED OR EXCLUDED UNDER ONTARIO LAW.",
      ],
    },
    {
      heading: "15. Indemnification",
      paragraphs: [
        "You agree to indemnify, defend, and hold harmless the operator, its contributors, moderators, and affiliates from any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or related to your use of the Service, your violation of these Terms, your violation of any law or third-party right, your User Content (including any community case submission), your representations or warranties under §7 being false or misleading, or any reliance by you or any third party on Service data, alerts, or output of the Service in making medical, clinical, emergency, life-safety, insurance, or legal decisions.",
      ],
    },
    {
      heading: "16. Force majeure",
      paragraphs: [
        "We are not liable for any failure or delay caused by events beyond our reasonable control, including acts of God, natural disasters, pandemics, government actions, war, civil disturbances, internet or telecommunications failures, or third-party service-provider failures (including Buy Me a Coffee, Mapbox, Vercel, Supabase, Resend, Twilio, and Sentry).",
      ],
    },
    {
      heading: "17. Disputes",
      paragraphs: [
        `Informal resolution first. Before commencing any formal dispute, contact us at ${PLACEHOLDERS.contactEmail}. We will respond within 30 days. We will both make a good-faith effort to resolve the dispute through direct negotiation for at least 60 days following your initial notice.`,
        "Small claims court. Either party may bring an individual claim in the Small Claims Court of the applicable jurisdiction (in Ontario, the Small Claims Court of the Superior Court of Justice).",
        "Courts of Ontario. Any dispute not resolved informally and outside small-claims jurisdiction shall be brought exclusively in the courts of the Province of Ontario, sitting in the City of Toronto. You and we attorn to the exclusive jurisdiction of those courts.",
        "No mandatory arbitration; no class-action waiver. Nothing in these Terms requires you to arbitrate or waive any right to participate in a class proceeding under applicable law.",
        "Quebec / international users. Nothing in this section displaces any non-waivable consumer-protection rights under the law of the place of your habitual residence.",
      ],
    },
    {
      heading: "18. Governing law",
      paragraphs: [
        "These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict-of-laws rules. The United Nations Convention on Contracts for the International Sale of Goods does not apply.",
      ],
    },
    {
      heading: "19. Modifications, miscellaneous, and contact",
      paragraphs: [
        "Modifications. We may modify these Terms at any time. Material changes will be communicated via email (for users with accounts) and via a banner on the Service for at least 30 days before they take effect.",
        "Severability. If any provision is held unenforceable, the remaining provisions remain in full force and effect.",
        "Entire agreement. These Terms, together with the Disclaimer, constitute the entire agreement between you and us regarding the Service.",
        "No waiver. Failure to enforce any provision is not a waiver.",
        "Assignment. You may not assign these Terms without our prior written consent. We may assign freely.",
        `Notices. Notices to you may be posted on the Service or surfaced in-app. Notices to us must be sent via ${PLACEHOLDERS.contactEmail}.`,
        "Language. These Terms are in English. Les parties confirment leur volonté que cette convention soit rédigée en langue anglaise. Translations are for convenience; the English version controls.",
      ],
      tail: [
        "Contact.",
        "Omar Bafagih, doing business as HantaVirusTrack",
        PLACEHOLDERS.contactEmail,
      ],
    },
  ],
};

// -----------------------------------------------------------------------------
// Privacy notice — FREE_MIGRATION.md §10 (placeholder text)
// -----------------------------------------------------------------------------

export const privacyContent = {
  effectiveDate: PLACEHOLDERS.effectiveDate,
  paragraphs: [
    `HantaVirusTrack is operated from Ontario, Canada and complies with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). We collect minimal personal information — the username you choose at sign-up, the coordinates of any watch zones you create, and the contents of any case submissions you send us. We use this information solely to operate the Service. We do not sell personal information. Our sub-processors are Vercel, Supabase, Mapbox, Sentry, Cloudflare, and Buy Me a Coffee — most are located in the United States. To request access to, correction of, or deletion of your data, message ${PLACEHOLDERS.privacyEmail}. Our designated Privacy Officer is Omar Bafagih, reachable at the same channel.`,
  ],
};

// -----------------------------------------------------------------------------
// Contact — FREE_MIGRATION.md §11
// -----------------------------------------------------------------------------

// Single contact channel: u/Ob344 on Reddit. Each row groups the kind of
// message that gets a faster reply, but the destination is the same handle.
export const contactContent = {
  rows: [
    { label: "General",              value: PLACEHOLDERS.contactEmail },
    { label: "Press",                value: PLACEHOLDERS.pressEmail },
    { label: "Data corrections",     value: PLACEHOLDERS.correctionsEmail },
    { label: "Submission questions", value: PLACEHOLDERS.contactEmail },
  ],
};

// -----------------------------------------------------------------------------
// Overview + methodology + FAQ — content for the About hub
// -----------------------------------------------------------------------------

export const overviewContent = {
  heading: "What is HantaVirusTrack?",
  paragraphs: [
    "HantaVirusTrack is an independent, free, live tracker for hantavirus cases worldwide. We aggregate confirmed and suspected cases from official health agencies — the CDC, WHO, ECDC, PAHO, ProMED, the Public Health Agency of Canada, and state and provincial health departments — and render them on an always-current interactive map.",
    "Every case links back to its original source. Every case is human-moderated before it appears on the public map. We accept community-submitted cases backed by verifiable source URLs, reviewed by the same moderation queue.",
    "The Service is free for everyone. There is no paid tier and no plans for one. If the project is useful to you, the Support page has a tip jar.",
  ],
};

export const methodologyContent = {
  heading: "Methodology",
  paragraphs: [
    "Sources. Case data comes from two streams.",
    "Stream one — automated ingestion. A scheduled job runs every fifteen minutes (for fast-cadence sources) or daily (for slow-cadence sources). Sources include the CDC's National Notifiable Diseases Surveillance System, the World Health Organization's Disease Outbreak News, the European Centre for Disease Prevention and Control, the Pan American Health Organization, ProMED-mail, and state and provincial health departments in the Four Corners region (New Mexico, Arizona, Colorado, Utah). Each source has its own fetcher that normalizes the raw response into a common case schema with location, status, strain, count, and a link back to the original.",
    "Stream two — community submissions. Logged-in users can submit candidate cases via the form at /submit. Submissions require a verifiable source URL — a press release, a news article, an official statement. Submissions without a source URL, or with a source we cannot verify, are rejected.",
    "Human moderation. No case appears on the public map without a human moderator's approval. The moderator reviews the source link, confirms the location and date, resolves geocoding ambiguity, and either approves, rejects (with a reason logged), or edits-and-approves. Approved community submissions are attributed in the case detail with the contributor's display name (or anonymously if no display name is set).",
    "Deduplication. Sources frequently re-report the same case; community submissions sometimes overlap with automated ingestion. We use a content-hash dedupe key based on source plus external ID (when stable IDs exist) or country plus state plus date plus count (when they don't). Re-fetches and overlapping submissions update the existing record rather than creating duplicates.",
    "What we don't do. We don't model, project, or predict. We don't compute case-fatality rates or transmission estimates. We don't aggregate community posts into case counts. If you see a number on this site, it came from an official source or a community submission with a verified source link, and is linked back to that source.",
    `Corrections. If you spot an error, message ${PLACEHOLDERS.correctionsEmail} with the case ID and the issue. We correct on a same-day basis when the source supports it.`,
  ],
};

export const aboutFaq = [
  {
    q: "Is HantaVirusTrack free?",
    a: "Yes. The map, the alerts, the public API, the embeds, the community-submission feature — everything is free. There is no paid tier and no plans for one. If the project is useful to you, the Support page has a tip jar.",
  },
  {
    q: "Where do you get your case data?",
    a: "Two places. First, automated ingestion from official sources: the CDC, WHO, ECDC, PAHO, ProMED-mail, and state and provincial health departments. Second, community submissions from logged-in users — every submission requires a verifiable source URL and goes through the same human moderation as automated ingestion. Every case on the map links to its original source.",
  },
  {
    q: "How can I contribute a case I've seen reported?",
    a: "Sign up free, then go to /submit. Fill in the form with the source URL (a press release, news article, or official statement), location, date, status, and any notes. A moderator reviews every submission. If approved, the case appears on the live map and is attributed to your display name (or anonymously if you'd prefer).",
  },
  {
    q: "How is this funded?",
    a: "Out of pocket plus voluntary donations through Buy Me a Coffee. We don't run ads, we don't sell data, and we have no paid tier.",
  },
  {
    q: "Are donations to HantaVirusTrack tax-deductible?",
    a: "No. We are not a registered charity. Donations are appreciated but cannot be claimed as charitable contributions on your tax return.",
  },
  {
    q: "How often is the map updated?",
    a: "Fast-cadence sources (ProMED, state and provincial health department press releases) are checked every fifteen minutes. Slow-cadence sources (CDC weekly surveillance, WHO Disease Outbreak News, ECDC, PAHO) are checked daily. Community submissions enter the moderation queue in real time. New cases appear on the map after a moderator approves them, typically within a few hours.",
  },
  {
    q: "Are these alerts reliable enough to make medical decisions?",
    a: "No. The map and alerts are journalistic and research tools, not a medical alert system. Source delays, our pipeline cadence, geocoding errors, and the natural lag between case occurrence and official reporting all mean that the absence of a case on our map does not mean the absence of risk in your area. Always consult your local public health authority for actionable risk information.",
  },
  {
    q: "I'm a researcher / journalist / public-health worker — can I get higher API access?",
    a: "Yes. Apply for free verified-researcher access at /researcher. We approve based on declared institution and intended use. Approved researchers get a higher API rate limit, raw data exports, and configurable embed widgets. There is no payment involved.",
  },
  {
    q: "Is this site associated with any government?",
    a: "No. HantaVirusTrack is independent. We aggregate publicly available information from those sources but are not affiliated with, endorsed by, or operated by any government, hospital, or international body.",
  },
];
