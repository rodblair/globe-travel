-- ============================================================
-- Globe Travel — full initial schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text,
  username             text unique,
  bio                  text,
  avatar_url           text,
  travel_style         text,
  onboarding_completed boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PLACES
-- ============================================================
create table if not exists public.places (
  id              uuid primary key default gen_random_uuid(),
  mapbox_id       text unique,
  name            text not null,
  country         text,
  country_code    text,
  latitude        double precision,
  longitude       double precision,
  photo_url       text,
  created_at      timestamptz default now()
);

alter table public.places enable row level security;

create policy "Places are publicly readable"
  on public.places for select using (true);

create policy "Authenticated users can upsert places"
  on public.places for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update places"
  on public.places for update
  using (auth.uid() is not null);

-- ============================================================
-- TRIPS
-- ============================================================
create table if not exists public.trips (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  title                 text not null,
  destination_place_id  uuid references public.places(id),
  start_date            date,
  end_date              date,
  travelers_count       integer default 1,
  pace                  text check (pace in ('relaxed', 'balanced', 'packed')),
  budget_level          text check (budget_level in ('budget', 'mid', 'luxury')),
  constraints           jsonb,
  share_slug            text unique,
  is_public             boolean default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table public.trips enable row level security;

create policy "Users can read own trips"
  on public.trips for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can insert own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trips"
  on public.trips for update
  using (auth.uid() = user_id);

create policy "Users can delete own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TRIP DAYS
-- ============================================================
create table if not exists public.trip_days (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  day_index   integer not null,
  date        date,
  title       text,
  notes       text,
  created_at  timestamptz default now()
);

alter table public.trip_days enable row level security;

create policy "Trip days visible with trip"
  on public.trip_days for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (t.user_id = auth.uid() or t.is_public = true)
    )
  );

create policy "Users can insert trip days for own trips"
  on public.trip_days for insert
  with check (
    exists (select 1 from public.trips where id = trip_id and user_id = auth.uid())
  );

create policy "Users can update trip days for own trips"
  on public.trip_days for update
  using (
    exists (select 1 from public.trips where id = trip_id and user_id = auth.uid())
  );

create policy "Users can delete trip days for own trips"
  on public.trip_days for delete
  using (
    exists (select 1 from public.trips where id = trip_id and user_id = auth.uid())
  );

-- ============================================================
-- TRIP ITEMS
-- ============================================================
create table if not exists public.trip_items (
  id               uuid primary key default gen_random_uuid(),
  trip_day_id      uuid not null references public.trip_days(id) on delete cascade,
  type             text not null check (type in ('activity', 'meal', 'lodging', 'transport')),
  title            text not null,
  start_time       text,
  end_time         text,
  duration_minutes integer,
  cost_estimate    numeric,
  notes            text,
  metadata         jsonb,
  order_index      integer default 0,
  place_id         uuid references public.places(id),
  updated_at       timestamptz default now(),
  created_at       timestamptz default now()
);

alter table public.trip_items enable row level security;

create policy "Trip items visible with trip"
  on public.trip_items for select
  using (
    exists (
      select 1 from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_id and (t.user_id = auth.uid() or t.is_public = true)
    )
  );

create policy "Users can insert trip items for own trips"
  on public.trip_items for insert
  with check (
    exists (
      select 1 from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_id and t.user_id = auth.uid()
    )
  );

create policy "Users can update trip items for own trips"
  on public.trip_items for update
  using (
    exists (
      select 1 from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete trip items for own trips"
  on public.trip_items for delete
  using (
    exists (
      select 1 from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIP ROUTES
-- ============================================================
create table if not exists public.trip_routes (
  trip_day_id  uuid not null references public.trip_days(id) on delete cascade,
  mode         text not null check (mode in ('walk', 'drive', 'transit')),
  geojson      jsonb,
  distance_m   double precision,
  duration_s   double precision,
  updated_at   timestamptz default now(),
  primary key (trip_day_id, mode)
);

alter table public.trip_routes enable row level security;

create policy "Trip routes visible with trip"
  on public.trip_routes for select
  using (
    exists (
      select 1 from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_id and (t.user_id = auth.uid() or t.is_public = true)
    )
  );

create policy "Users can upsert routes for own trips"
  on public.trip_routes for insert
  with check (
    exists (
      select 1 from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_id and t.user_id = auth.uid()
    )
  );

create policy "Users can update routes for own trips"
  on public.trip_routes for update
  using (
    exists (
      select 1 from public.trip_days td
      join public.trips t on t.id = td.trip_id
      where td.id = trip_day_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- USER PLACES
-- ============================================================
create table if not exists public.user_places (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  place_id    uuid not null references public.places(id) on delete cascade,
  status      text default 'visited' check (status in ('visited', 'bucket_list', 'want_to_visit')),
  notes       text,
  visit_date  date,
  rating      integer check (rating between 1 and 5),
  created_at  timestamptz default now()
);

alter table public.user_places enable row level security;

create policy "Users can read own places"
  on public.user_places for select
  using (auth.uid() = user_id);

create policy "Users can insert own places"
  on public.user_places for insert
  with check (auth.uid() = user_id);

create policy "Users can update own places"
  on public.user_places for update
  using (auth.uid() = user_id);

create policy "Users can delete own places"
  on public.user_places for delete
  using (auth.uid() = user_id);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
create table if not exists public.journal_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  content         text not null,
  mood            text,
  user_place_id   uuid references public.user_places(id) on delete set null,
  location        text,
  visited_date    date,
  trip_id         uuid references public.trips(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.journal_entries enable row level security;

create policy "Users can read own journal entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own journal entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own journal entries"
  on public.journal_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own journal entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  user_id                 uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    text not null default 'free' check (plan in ('free', 'pro')),
  status                  text not null default 'active',
  current_period_end      timestamptz,
  cancel_at_period_end    boolean default false,
  updated_at              timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role bypass (webhook writes)
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- TRIP FEEDBACK
-- ============================================================
create table if not exists public.trip_feedback (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  author_name  text not null,
  author_email text,
  sentiment    text check (sentiment in ('love_it', 'curious', 'practical')),
  comment      text,
  created_at   timestamptz default now()
);

alter table public.trip_feedback enable row level security;

create policy "Public trips feedback is readable"
  on public.trip_feedback for select
  using (
    exists (select 1 from public.trips where id = trip_id and is_public = true)
  );

create policy "Anyone can submit feedback on public trips"
  on public.trip_feedback for insert
  with check (
    exists (select 1 from public.trips where id = trip_id and is_public = true)
  );

-- ============================================================
-- INDEXES for common queries
-- ============================================================
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_share_slug on public.trips(share_slug);
create index if not exists idx_trip_days_trip_id on public.trip_days(trip_id);
create index if not exists idx_trip_items_trip_day_id on public.trip_items(trip_day_id);
create index if not exists idx_user_places_user_id on public.user_places(user_id);
create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
create index if not exists idx_journal_entries_visited_date on public.journal_entries(visited_date desc);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);
