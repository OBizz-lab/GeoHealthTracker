export type ReportStatus = "confirmed" | "suspected" | "reported" | "resolved";

export type ReportSeverity = "low" | "moderate" | "high" | "critical";

export interface Report {
  id: string;
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
