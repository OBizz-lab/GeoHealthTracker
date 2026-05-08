export type ReportStatus = "confirmed" | "suspected" | "fatal" | "reported" | "resolved";

export type ReportSeverity = "low" | "moderate" | "high" | "critical";

/** Discriminator: confirmed = official case data, mention = news/social signal. */
export type ReportKind = "confirmed" | "mention";

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
  case_count: number;
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
