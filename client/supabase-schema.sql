-- ============================================================
-- Globe Travel - Supabase Schema Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  travel_style text,
  onboarding_completed boolean default false,
  countries_count int default 0,
  places_count int default 0,
  streak_days int default 0,
  last_active_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PLACES (canonical destinations)
create table places (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  country text,
  country_code text,
  continent text,
  latitude float8 not null,
  longitude float8 not null,
  mapbox_place_id text unique,
  photo_url text,
  category text,
  trending_score float default 0,
  created_at timestamptz default now()
);

-- USER_PLACES
create table user_places (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade not null,
  place_id uuid references places on delete cascade not null,
  status text not null check (status in ('visited', 'bucket_list', 'planning')),
  rating int check (rating between 1 and 5),
  visit_date date,
  notes text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, place_id)
);

-- JOURNAL_ENTRIES
create table journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_place_id uuid references user_places on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  title text,
  content text,
  mood text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- JOURNAL_PHOTOS
create table journal_photos (
  id uuid primary key default uuid_generate_v4(),
  journal_entry_id uuid references journal_entries on delete cascade,
  storage_path text not null,
  caption text,
  "order" int default 0,
  created_at timestamptz default now()
);

-- CHAT_CONVERSATIONS
create table chat_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade not null,
  type text not null check (type in ('onboarding', 'explore', 'plan')),
  title text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CHAT_MESSAGES
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references chat_conversations on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- COLLECTIONS
create table collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  is_public boolean default false,
  is_editorial boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRIPS
create table trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade not null,
  title text not null,
  destination_place_id uuid references places on delete set null,
  start_date date,
  end_date date,
  travelers_count int default 1,
  pace text,
  budget_level text,
  constraints jsonb default '{}'::jsonb,
  is_public boolean default false,
  share_slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_trips_user on trips(user_id, updated_at desc);
create index idx_trips_share_slug on trips(share_slug);

-- TRIP_DAYS
create table trip_days (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips on delete cascade not null,
  day_index int not null,
  date date,
  title text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(trip_id, day_index)
);

create index idx_trip_days_trip on trip_days(trip_id, day_index);

-- TRIP_ITEMS
create table trip_items (
  id uuid primary key default uuid_generate_v4(),
  trip_day_id uuid references trip_days on delete cascade not null,
  type text not null check (type in ('activity','meal','lodging','transit','note')),
  title text not null,
  place_id uuid references places on delete set null,
  start_time time,
  end_time time,
  duration_minutes int,
  cost_estimate numeric,
  notes text,
  metadata jsonb default '{}'::jsonb,
  order_index int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_trip_items_day_order on trip_items(trip_day_id, order_index);
create index idx_trip_items_place on trip_items(place_id);

-- TRIP_ROUTES (cached)
create table trip_routes (
  id uuid primary key default uuid_generate_v4(),
  trip_day_id uuid references trip_days on delete cascade not null,
  geojson jsonb not null,
  distance_m int,
  duration_s int,
  mode text default 'walk',
  updated_at timestamptz default now(),
  unique(trip_day_id, mode)
);

-- COLLECTION_PLACES
create table collection_places (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections on delete cascade,
  place_id uuid references places on delete cascade,
  "order" int default 0,
  note text
);

-- FRIENDSHIPS
create table friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid references profiles on delete cascade,
  addressee_id uuid references profiles on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- ACHIEVEMENTS
create table achievements (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  icon text,
  threshold int,
  category text
);

-- USER_ACHIEVEMENTS
create table user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles on delete cascade,
  achievement_id uuid references achievements on delete cascade,
  earned_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- INDEXES
create index idx_user_places_user_status on user_places(user_id, status);
create index idx_user_places_place on user_places(place_id);
create index idx_places_coords on places(latitude, longitude);
create index idx_places_mapbox on places(mapbox_place_id);
create index idx_friendships_addressee on friendships(addressee_id, status);
create index idx_chat_messages_conv on chat_messages(conversation_id);
create index idx_journal_entries_user_place on journal_entries(user_place_id);

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- UPDATE COUNTS TRIGGER
create or replace function public.update_user_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    update profiles set
      places_count = (select count(*) from user_places where user_id = NEW.user_id and status = 'visited'),
      countries_count = (select count(distinct p.country_code) from user_places up join places p on p.id = up.place_id where up.user_id = NEW.user_id and up.status = 'visited'),
      updated_at = now()
    where id = NEW.user_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update profiles set
      places_count = (select count(*) from user_places where user_id = OLD.user_id and status = 'visited'),
      countries_count = (select count(distinct p.country_code) from user_places up join places p on p.id = up.place_id where up.user_id = OLD.user_id and up.status = 'visited'),
      updated_at = now()
    where id = OLD.user_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_user_place_changed
  after insert or update or delete on user_places
  for each row execute function public.update_user_counts();

-- RLS POLICIES
alter table profiles enable row level security;
alter table places enable row level security;
alter table user_places enable row level security;
alter table journal_entries enable row level security;
alter table journal_photos enable row level security;
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;
alter table collections enable row level security;
alter table collection_places enable row level security;
alter table friendships enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table trips enable row level security;
alter table trip_days enable row level security;
alter table trip_items enable row level security;
alter table trip_routes enable row level security;

-- Profiles: users can read all, update own
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Places: everyone can read, authenticated can insert
create policy "Places are viewable by everyone" on places for select using (true);
create policy "Authenticated users can create places" on places for insert with check (auth.role() = 'authenticated');

-- User places: users manage their own
create policy "Users can view own places" on user_places for select using (auth.uid() = user_id);
create policy "Users can insert own places" on user_places for insert with check (auth.uid() = user_id);
create policy "Users can update own places" on user_places for update using (auth.uid() = user_id);
create policy "Users can delete own places" on user_places for delete using (auth.uid() = user_id);

-- Journal: users manage their own
create policy "Users can view own journal" on journal_entries for select using (auth.uid() = user_id);
create policy "Users can create journal entries" on journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own journal" on journal_entries for update using (auth.uid() = user_id);
create policy "Users can delete own journal" on journal_entries for delete using (auth.uid() = user_id);

-- Journal photos: via journal entry ownership
create policy "Users can view own photos" on journal_photos for select using (
  exists (select 1 from journal_entries je where je.id = journal_entry_id and je.user_id = auth.uid())
);
create policy "Users can add photos" on journal_photos for insert with check (
  exists (select 1 from journal_entries je where je.id = journal_entry_id and je.user_id = auth.uid())
);
create policy "Users can delete own photos" on journal_photos for delete using (
  exists (select 1 from journal_entries je where je.id = journal_entry_id and je.user_id = auth.uid())
);

-- Chat: users manage their own
create policy "Users can view own conversations" on chat_conversations for select using (auth.uid() = user_id);
create policy "Users can create conversations" on chat_conversations for insert with check (auth.uid() = user_id);
create policy "Users can update own conversations" on chat_conversations for update using (auth.uid() = user_id);

create policy "Users can view own messages" on chat_messages for select using (
  exists (select 1 from chat_conversations cc where cc.id = conversation_id and cc.user_id = auth.uid())
);
create policy "Users can create messages" on chat_messages for insert with check (
  exists (select 1 from chat_conversations cc where cc.id = conversation_id and cc.user_id = auth.uid())
);

-- Trips: users manage their own, public trips are viewable
create policy "Public trips are viewable by everyone" on trips
  for select using (is_public = true);
create policy "Users can view own trips" on trips
  for select using (auth.uid() = user_id);
create policy "Users can create own trips" on trips
  for insert with check (auth.uid() = user_id);
create policy "Users can update own trips" on trips
  for update using (auth.uid() = user_id);
create policy "Users can delete own trips" on trips
  for delete using (auth.uid() = user_id);

-- Trip days: owner can manage, public trip days are viewable
create policy "Public trip days are viewable" on trip_days
  for select using (
    exists (select 1 from trips t where t.id = trip_id and t.is_public = true)
  );
create policy "Users can view own trip days" on trip_days
  for select using (
    exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid())
  );
create policy "Users can create own trip days" on trip_days
  for insert with check (
    exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid())
  );
create policy "Users can update own trip days" on trip_days
  for update using (
    exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid())
  );
create policy "Users can delete own trip days" on trip_days
  for delete using (
    exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- Trip items: owner can manage, public trip items are viewable
create policy "Public trip items are viewable" on trip_items
  for select using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.is_public = true
    )
  );
create policy "Users can view own trip items" on trip_items
  for select using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );
create policy "Users can create own trip items" on trip_items
  for insert with check (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );
create policy "Users can update own trip items" on trip_items
  for update using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );
create policy "Users can delete own trip items" on trip_items
  for delete using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );

-- Trip routes: viewable if trip is public or owned
create policy "Public trip routes are viewable" on trip_routes
  for select using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.is_public = true
    )
  );
create policy "Users can view own trip routes" on trip_routes
  for select using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );
create policy "Users can upsert own trip routes" on trip_routes
  for insert with check (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );
create policy "Users can update own trip routes" on trip_routes
  for update using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );
create policy "Users can delete own trip routes" on trip_routes
  for delete using (
    exists (
      select 1
      from trip_days d
      join trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );

-- Collections: public ones viewable by all, own ones manageable
create policy "Public collections viewable" on collections for select using (is_public = true or auth.uid() = user_id);
create policy "Users can create collections" on collections for insert with check (auth.uid() = user_id);
create policy "Users can update own collections" on collections for update using (auth.uid() = user_id);
create policy "Users can delete own collections" on collections for delete using (auth.uid() = user_id);

create policy "Collection places viewable" on collection_places for select using (
  exists (select 1 from collections c where c.id = collection_id and (c.is_public = true or c.user_id = auth.uid()))
);
create policy "Users can manage collection places" on collection_places for insert with check (
  exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid())
);
create policy "Users can delete collection places" on collection_places for delete using (
  exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid())
);

-- Friendships
create policy "Users can view own friendships" on friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can create friendships" on friendships for insert with check (auth.uid() = requester_id);
create policy "Users can update friendships" on friendships for update using (auth.uid() = addressee_id or auth.uid() = requester_id);

-- Achievements: viewable by all
create policy "Achievements viewable" on achievements for select using (true);
create policy "User achievements viewable" on user_achievements for select using (true);
create policy "System can grant achievements" on user_achievements for insert with check (auth.uid() = user_id);

-- SEED ACHIEVEMENTS
insert into achievements (slug, title, description, icon, threshold, category) values
('first_pin', 'First Pin', 'Added your first place to the map', '📍', 1, 'places'),
('explorer_5', 'Explorer', 'Visited 5 different places', '🧭', 5, 'places'),
('globetrotter_10', 'Globetrotter', 'Visited 10 different places', '🌍', 10, 'places'),
('world_traveler_25', 'World Traveler', 'Visited 25 different places', '✈️', 25, 'places'),
('country_collector_5', '5 Countries Club', 'Visited 5 different countries', '🏳️', 5, 'countries'),
('country_collector_10', 'Continent Hopper', 'Visited 10 different countries', '🌎', 10, 'countries'),
('country_collector_20', 'Globe Master', 'Visited 20 different countries', '👑', 20, 'countries'),
('journal_keeper', 'Journal Keeper', 'Written 5 journal entries', '📖', 5, 'journal'),
('storyteller', 'Storyteller', 'Written 10 journal entries', '✍️', 10, 'journal'),
('bucket_dreamer', 'Big Dreamer', 'Added 10 places to your bucket list', '⭐', 10, 'bucket_list'),
('social_butterfly', 'Social Butterfly', 'Connected with 5 friends', '🦋', 5, 'social'),
('collection_curator', 'Curator', 'Created 3 collections', '🎨', 3, 'collections');

-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('journal-photos', 'journal-photos', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
