-- Run this in the Supabase SQL Editor to cleanly reset and apply the schema

-- 1. Drop existing tables if they exist to prevent "already exists" errors
DROP TABLE IF EXISTS public.time_entries CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.cta CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.get_public_summary(text, text);
DROP FUNCTION IF EXISTS public.clean_stale_timers(uuid);

-- 2. Profiles table
CREATE TABLE public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  slug          text unique not null,
  display_name  text not null default '',
  page_title    text not null default '',
  page_desc     text not null default '',
  default_view  text not null default 'week' check (default_view in ('week','month')),
  timezone      text not null default 'UTC',
  is_public     boolean not null default true,
  auto_stop_timer_hours integer not null default 8 check (auto_stop_timer_hours > 0),
  created_at    timestamptz not null default now()
);

-- 3. CTA table
CREATE TABLE public.cta (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  title        text,
  description  text,
  url          text
);

-- 4. Items table
CREATE TABLE public.items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  description         text,
  link                text,
  allocated_hours     double precision not null,
  allocated_period    text not null default 'week' check (allocated_period in ('day','week','month')),
  tracking_mode       text not null check (tracking_mode in ('assumed_spent','manual_track')),
  notice_period_days  integer,
  end_date            date,
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  show_stats_publicly boolean not null default true,
  show_on_public      boolean not null default true,
  created_at          timestamptz not null default now()
);
CREATE INDEX items_user_idx ON public.items(user_id);
ALTER TABLE public.items ADD CONSTRAINT assumed_has_no_notice
  CHECK (tracking_mode <> 'assumed_spent' OR notice_period_days IS NULL);

-- 5. Time entries table
CREATE TABLE public.time_entries (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  stopped_at  timestamptz,
  notes       text,
  created_at  timestamptz not null default now()
);
CREATE INDEX time_entries_item_idx ON public.time_entries(item_id);
CREATE UNIQUE INDEX one_running_per_item ON public.time_entries(item_id) WHERE (stopped_at IS NULL);

-- 5b. Helper to auto-stop stale timers
CREATE OR REPLACE FUNCTION public.clean_stale_timers(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.time_entries te
  SET stopped_at = started_at + (p.auto_stop_timer_hours || ' hours')::interval
  FROM public.profiles p
  WHERE te.user_id = p.id
    AND p.id = p_user_id
    AND te.stopped_at IS NULL
    AND now() > te.started_at + (p.auto_stop_timer_hours || ' hours')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- CTA Policies
CREATE POLICY "CTA viewable by everyone if profile public." ON public.cta
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = cta.user_id AND profiles.is_public = true)
  );
CREATE POLICY "Users can view own cta." ON public.cta
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cta." ON public.cta
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cta." ON public.cta
  FOR UPDATE USING (auth.uid() = user_id);

-- Items Policies
CREATE POLICY "Items are viewable by owner." ON public.items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Items can be inserted by owner." ON public.items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Items can be updated by owner." ON public.items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Items can be deleted by owner." ON public.items
  FOR DELETE USING (auth.uid() = user_id);

-- Time Entries Policies
CREATE POLICY "Time entries viewable by owner." ON public.time_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Time entries insertable by owner." ON public.time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Time entries updatable by owner." ON public.time_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Time entries deletable by owner." ON public.time_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Table to track historical capacity promises
CREATE TABLE public.item_allocations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  allocated_hours numeric not null,
  allocated_period text not null check (allocated_period in ('day','week','month')),
  valid_from timestamptz not null default now(),
  valid_to timestamptz
);

ALTER TABLE public.item_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own item allocations" ON public.item_allocations
  FOR ALL USING (
    item_id IN (SELECT id FROM public.items WHERE user_id = auth.uid())
  );

-- Trigger to automatically track capacity changes
CREATE OR REPLACE FUNCTION public.track_item_allocation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.item_allocations (item_id, allocated_hours, allocated_period, valid_from)
    VALUES (NEW.id, NEW.allocated_hours, NEW.allocated_period, NEW.created_at);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.allocated_hours <> OLD.allocated_hours OR NEW.allocated_period <> OLD.allocated_period THEN
      UPDATE public.item_allocations SET valid_to = now() WHERE item_id = NEW.id AND valid_to IS NULL;
      INSERT INTO public.item_allocations (item_id, allocated_hours, allocated_period, valid_from)
      VALUES (NEW.id, NEW.allocated_hours, NEW.allocated_period, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER item_allocation_tracker
AFTER INSERT OR UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.track_item_allocation_change();

-- Helper function to calculate proportional historical completion
CREATE OR REPLACE FUNCTION public.calculate_period_completion(p_item_id uuid, p_days int)
RETURNS numeric AS $$
DECLARE
  v_allocated_hours numeric;
  v_tracked_hours numeric;
  v_completion numeric;
  v_item RECORD;
BEGIN
  -- Get the current item allocation directly
  SELECT i.*, p.auto_stop_timer_hours 
  INTO v_item 
  FROM public.items i
  JOIN public.profiles p ON p.id = i.user_id
  WHERE i.id = p_item_id;

  IF v_item.allocated_period = 'day' THEN
    v_allocated_hours := v_item.allocated_hours * p_days;
  ELSIF v_item.allocated_period = 'week' THEN
    v_allocated_hours := v_item.allocated_hours * (p_days / 7.0);
  ELSIF v_item.allocated_period = 'month' THEN
    v_allocated_hours := v_item.allocated_hours * (p_days / 30.0);
  END IF;

  -- Sum tracked hours
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (
    LEAST(COALESCE(stopped_at, NOW()), started_at + (v_item.auto_stop_timer_hours || ' hours')::interval) - GREATEST(started_at, (NOW() - (p_days || ' days')::interval))
  )) / 3600.0), 0) INTO v_tracked_hours
  FROM public.time_entries
  WHERE item_id = p_item_id 
    AND LEAST(COALESCE(stopped_at, NOW()), started_at + (v_item.auto_stop_timer_hours || ' hours')::interval) > (NOW() - (p_days || ' days')::interval);

  IF COALESCE(v_allocated_hours, 0) > 0 THEN
    v_completion := ROUND((v_tracked_hours / v_allocated_hours) * 100);
  ELSE
    v_completion := 0;
  END IF;

  RETURN v_completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Public Summary Helper Function
CREATE OR REPLACE FUNCTION public.get_public_summary(p_slug TEXT, p_view TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_is_public BOOLEAN;
  v_page_title TEXT;
  v_page_desc TEXT;
  v_timezone TEXT;
  v_cta JSON;
  v_cap NUMERIC;
  v_alloc_total NUMERIC := 0;
  v_potential_avail NUMERIC := 0;
  v_item RECORD;
  v_items_json JSONB := '[]'::JSONB;
  v_weekly_alloc NUMERIC;
  v_alloc_view NUMERIC;
  v_spent_view NUMERIC;
  v_completion NUMERIC;
  v_window_interval INTERVAL;
  
  v_days_active NUMERIC;
  v_7d NUMERIC;
  v_30d NUMERIC;
  v_90d NUMERIC;
  v_120d NUMERIC;
  v_auto_stop_hours INT;
BEGIN
  -- Get profile
  SELECT id, is_public, page_title, page_desc, timezone, auto_stop_timer_hours
  INTO v_user_id, v_is_public, v_page_title, v_page_desc, v_timezone, v_auto_stop_hours
  FROM public.profiles
  WHERE slug = p_slug;
  
  IF v_user_id IS NULL OR v_is_public = false THEN
    RETURN NULL;
  END IF;

  -- Get CTA
  SELECT json_build_object('title', title, 'description', description, 'url', url)
  INTO v_cta
  FROM public.cta
  WHERE user_id = v_user_id;

  -- Set capacity
  IF p_view = 'month' THEN
    v_cap := 720;
    v_window_interval := '30 days'::INTERVAL;
  ELSE
    v_cap := 168;
    v_window_interval := '7 days'::INTERVAL;
  END IF;

  -- Process active items (ignore items whose end_date has passed in user's timezone)
  FOR v_item IN (
    SELECT * FROM public.items 
    WHERE user_id = v_user_id 
      AND is_active = true 
      AND (end_date IS NULL OR end_date >= (CURRENT_TIMESTAMP AT TIME ZONE v_timezone)::DATE)
    ORDER BY sort_order
  ) LOOP
    
    IF v_item.allocated_period = 'day' THEN
      v_weekly_alloc := v_item.allocated_hours * 7.0;
    ELSIF v_item.allocated_period = 'month' THEN
      v_weekly_alloc := v_item.allocated_hours * (7.0 / 30.0);
    ELSE
      v_weekly_alloc := v_item.allocated_hours;
    END IF;

    IF p_view = 'month' THEN
      v_alloc_view := v_weekly_alloc * (30.0 / 7.0);
    ELSE
      v_alloc_view := v_weekly_alloc;
    END IF;
    
    v_alloc_total := v_alloc_total + v_alloc_view;
    
    IF v_item.notice_period_days = 0 THEN
      v_potential_avail := v_potential_avail + v_alloc_view;
    END IF;
    
    -- Only add visible items to the public items list
    IF v_item.show_on_public = true THEN
      -- ALWAYS RESET STATS TO NULL SO THEY DON'T LEAK BETWEEN ITEMS
      v_7d := NULL;
      v_30d := NULL;
      v_90d := NULL;
      v_120d := NULL;
      
      -- ONLY CALCULATE STATS IF TRACKING IS MANUAL AND THE USER WANTS THEM SHOWN PUBLICLY
      IF v_item.tracking_mode = 'manual_track' AND v_item.show_stats_publicly = true THEN
        v_days_active := EXTRACT(day FROM (NOW() - v_item.created_at));
        
        -- Calculate multi-period stats
        v_7d := public.calculate_period_completion(v_item.id, 7);
        
        IF v_days_active >= 30 THEN v_30d := public.calculate_period_completion(v_item.id, 30); END IF;
        IF v_days_active >= 90 THEN v_90d := public.calculate_period_completion(v_item.id, 90); END IF;
        IF v_days_active >= 120 THEN v_120d := public.calculate_period_completion(v_item.id, 120); END IF;
      END IF;
      
      v_items_json := v_items_json || jsonb_build_object(
        'title', v_item.title,
        'description', v_item.description,
        'link', v_item.link,
        'allocated', v_alloc_view,
        'stats_7d', v_7d,
        'stats_30d', v_30d,
        'stats_90d', v_90d,
        'stats_120d', v_120d,
        'notice_days', v_item.notice_period_days,
        'end_date', v_item.end_date
      );
    END IF;
  END LOOP;

  RETURN json_build_object(
    'page_title', v_page_title,
    'page_desc', v_page_desc,
    'cta', v_cta,
    'items', v_items_json,
    'comfortable', v_cap - v_alloc_total,
    'potential', (v_cap - v_alloc_total) + v_potential_avail
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_summary(text, text) TO anon, authenticated, service_role;

-- 8. FORCE SCHEMA CACHE RELOAD
-- This tells the Supabase API to instantly recognize the newly created tables!
NOTIFY pgrst, 'reload schema';
