import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/*
 * ══════════════════════════════════════════
 * SUPABASE SCHEMA — run this in SQL editor
 * ══════════════════════════════════════════
 *
 * -- PROFILES (extends auth.users)
 * create table profiles (
 *   id uuid references auth.users primary key,
 *   full_name text not null,
 *   badge_number text unique not null,
 *   role text not null default 'guard' check (role in ('guard','supervisor','manager')),
 *   post text,
 *   avatar_url text,
 *   created_at timestamptz default now()
 * );
 * alter table profiles enable row level security;
 * create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
 * create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
 *
 * -- INCIDENTS
 * create table incidents (
 *   id uuid primary key default gen_random_uuid(),
 *   report_number text unique not null,
 *   type text not null,
 *   severity text not null check (severity in ('low','medium','high','critical')),
 *   status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
 *   location text not null,
 *   zone text,
 *   description text not null,
 *   ai_summary text,
 *   ai_classification text,
 *   ai_escalation_advice text,
 *   witnesses text,
 *   authorities_notified text,
 *   photo_urls text[],
 *   guard_id uuid references profiles(id),
 *   guard_name text,
 *   post text,
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now()
 * );
 * alter table incidents enable row level security;
 * create policy "Guards can insert incidents" on incidents for insert with check (auth.uid() = guard_id);
 * create policy "All authenticated can view incidents" on incidents for select using (auth.role() = 'authenticated');
 * create policy "Guards/supervisors can update" on incidents for update using (auth.uid() = guard_id or exists(select 1 from profiles where id = auth.uid() and role in ('supervisor','manager')));
 *
 * -- PATROL CHECKPOINTS
 * create table patrol_checkpoints (
 *   id uuid primary key default gen_random_uuid(),
 *   name text not null,
 *   zone text not null,
 *   priority text not null default 'medium' check (priority in ('low','medium','high')),
 *   post text not null,
 *   order_index int default 0
 * );
 *
 * -- PATROL LOGS
 * create table patrol_logs (
 *   id uuid primary key default gen_random_uuid(),
 *   checkpoint_id uuid references patrol_checkpoints(id),
 *   guard_id uuid references profiles(id),
 *   guard_name text,
 *   notes text,
 *   shift_date date default current_date,
 *   checked_at timestamptz default now()
 * );
 * alter table patrol_logs enable row level security;
 * create policy "Guards can manage patrol logs" on patrol_logs for all using (auth.uid() = guard_id);
 * create policy "Supervisors can view all logs" on patrol_logs for select using (exists(select 1 from profiles where id = auth.uid() and role in ('supervisor','manager')));
 *
 * -- Enable realtime
 * alter publication supabase_realtime add table incidents;
 * alter publication supabase_realtime add table patrol_logs;
 */