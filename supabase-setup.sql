-- Events table (owned by venues)
create table if not exists public.events (
  id text primary key,
  venue_id uuid references auth.users on delete cascade,
  name text, date text, start_time text, end_time text,
  venue text, dance_floor text, amount numeric default 0,
  notes text default '', frequency text default 'single',
  status text default 'created', artist_id text, artist_name text,
  interest_checks jsonb default '[]', booking_requests jsonb default '[]',
  open_for_requests boolean default false,
  created_at timestamptz default now()
);
alter table public.events enable row level security;
create policy "Venues manage own events" on public.events for all using (auth.uid() = venue_id);
create policy "DJs can view events" on public.events for select using (true);
create policy "DJs can update events" on public.events for update using (true);

-- Venue profiles
create table if not exists public.venue_profiles (
  id uuid references auth.users on delete cascade primary key,
  company_name text default '', address text default '',
  opening_hours text default '', general_info text default '',
  account_manager text default '', account_manager_phone text default '',
  gage_range text default '', artist_types text[] default '{}',
  photo text default '', dance_floors jsonb default '[]',
  updated_at timestamptz default now()
);
alter table public.venue_profiles enable row level security;
create policy "Users manage own venue profile" on public.venue_profiles for all using (auth.uid() = id);

-- DJ profiles
create table if not exists public.dj_profiles (
  id uuid references auth.users on delete cascade primary key,
  name text default '', bio text default '', genres text[] default '{}',
  category text default 'Club DJ', location text default '',
  photo text default '', photo_x int default 50, photo_y int default 50,
  price text default '', press_kit jsonb,
  updated_at timestamptz default now()
);
alter table public.dj_profiles enable row level security;
create policy "Users manage own dj profile" on public.dj_profiles for all using (auth.uid() = id);

-- Connections (venue <-> DJ)
create table if not exists public.connections (
  id text primary key, artist_id text, artist_name text,
  artist_type text, artist_location text, artist_genres text[] default '{}',
  venue_id text, venue_name text, status text default 'pending',
  requested_at timestamptz default now()
);
alter table public.connections enable row level security;
create policy "Anyone can read connections" on public.connections for select using (true);
create policy "Anyone can manage connections" on public.connections for all using (true);

-- Chats
create table if not exists public.chats (
  id text primary key, venue_id text, artist_id text,
  artist_name text, venue_name text, messages jsonb default '[]',
  venue_unread int default 0, dj_unread int default 0,
  updated_at timestamptz default now()
);
alter table public.connections enable row level security;
create policy "Anyone can read chats" on public.chats for select using (true);
create policy "Anyone can manage chats" on public.chats for all using (true);
