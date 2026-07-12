export type TrackingMode = 'assumed_spent' | 'manual_track';
export type ViewMode = 'week' | 'month';

export interface Profile {
  id: string;
  slug: string;
  display_name: string;
  page_title: string;
  page_desc: string;
  default_view: ViewMode;
  timezone: string;
  is_public: boolean;
  created_at: string;
}

export interface CTA {
  user_id: string;
  title: string | null;
  description: string | null;
  url: string | null;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  link: string | null;
  allocated_hours: number;
  allocated_period: 'day' | 'week' | 'month';
  tracking_mode: TrackingMode;
  notice_period_days: number | null;
  end_date: string | null;
  sort_order: number;
  is_active: boolean;
  show_stats_publicly: boolean;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  item_id: string;
  user_id: string;
  started_at: string;
  stopped_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface PublicItemSummary {
  title: string;
  description: string | null;
  link: string | null;
  allocated: number;
  notice_days: number | null;
  stats_7d: number | null;
  stats_30d: number | null;
  stats_90d: number | null;
  stats_120d: number | null;
  end_date: string | null;
}

export interface PublicSummary {
  display_name: string;
  page_title: string;
  page_desc: string;
  view: ViewMode;
  capacity: number;
  items: PublicItemSummary[];
  comfortable: number;
  potential: number;
  cta: Omit<CTA, 'user_id'> | null;
}
