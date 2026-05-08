export type ReportStatus = "confirmed" | "suspected" | "fatal" | "reported" | "resolved";

export type ReportSeverity = "low" | "moderate" | "high" | "critical";

/**
 * Discriminator:
 *   confirmed = official case data (counts toward Total cases / Fatalities)
 *   mention   = news/social signal (counts toward Mentions only)
 *   exposed   = surveillance-follow-up country: a contact of a confirmed case
 *               has returned home, but is NOT themselves a confirmed case.
 *               Counts toward Active regions only — never toward case totals.
 */
export type ReportKind = "confirmed" | "mention" | "exposed";

export interface Report {
  id: string;
  kind: ReportKind;
  lat: number;
  lng: number;
  location_name: string;
  country: string;
  state_province?: string;
  status: ReportStatus;
  severity: ReportSeverity;
  reported_date: string;
  source_url?: string;
  source_name: string;
  /** Total distinct people represented by this row. Includes any deceased. */
  case_count: number;
  /**
   * Subset of `case_count` who died. NEVER added to `case_count` in
   * aggregations — see CASE_COUNT_METHODOLOGY.md §2.
   */
  fatality_count: number;
  /** Optional outbreak-grouping identifier, e.g. 'mv-hondius-2026'. */
  cluster_id?: string;
  notes: string;
  condition?: string;
}

// =============================================================================
// Signal feed (Live Signal strip — SOCIAL_INTEGRATION.md §5.3)
// =============================================================================

export interface SignalNews {
  id:                  string;
  publisher_domain:    string;
  publisher_name:      string;
  publisher_logo_slug: string;
  publisher_region:    string;
  country:             string | null;
  headline:            string;
  url:                 string;
  published_at:        string; // ISO
  language:            string;
}

export interface SignalReddit {
  id:                  string;     // 't1_xxxx'
  thread_id:           string;     // 't3_xxxx'
  subreddit:           string;
  author:              string;
  author_flair:        string | null;
  body:                string;
  permalink:           string;
  thread_url:          string;
  thread_title:        string;
  ups:                 number;
  num_replies:         number;
  awards:              number;
  velocity_score:      number;
  created_at_reddit:   string;     // ISO
  language:            string;
  removed:             boolean;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  organization_type: "government" | "ngo" | "academic" | "media";
  trust_score: number;
}

export interface WatchZone {
  id: string;
  user_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  confirmed: boolean;
}

export type StatusColorMap = Record<ReportStatus, string>;
