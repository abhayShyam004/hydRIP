create table visited_stops (
  stop_id text primary key,
  visited boolean default false,
  visited_at timestamptz
);

create table checked_in (
  id uuid default gen_random_uuid() primary key,
  stop_id text not null,
  user_name text not null,
  unique(stop_id, user_name)
);

create table checklist_definitions (
  id text primary key,
  category text not null,
  label text not null,
  sort_order integer
);

create table checklist_items (
  id uuid default gen_random_uuid() primary key,
  user_name text not null,
  item_id text not null references checklist_definitions(id) on delete cascade,
  checked boolean default false,
  unique(user_name, item_id)
);

create table stops (
  id text primary key,
  day integer not null,
  time text not null,
  date text not null,
  name text not null,
  location text,
  distance text,
  entry_fee numeric default 0,
  duration text,
  description text,
  photo_spot text,
  abhay_note text,
  alternative_name text,
  alternative_maps_url text,
  directions_url text,
  sort_order integer
);

create table restaurants (
  id text primary key,
  name text not null,
  meal_type text,
  day integer,
  time text,
  address text,
  distance text,
  has_cash_only_note boolean default false,
  sort_order integer
);

create table menu_items (
  id uuid default gen_random_uuid() primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  name text not null,
  price numeric not null,
  diet text not null check (diet in ('veg', 'non-veg')),
  sort_order integer
);

create table trip_tips (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  sort_order integer
);

create table emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  number text not null,
  sort_order integer
);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric not null,
  paid_by text not null,
  split_with text[] not null,
  category text not null,
  created_at timestamptz default now()
);

create table settlements (
  id uuid default gen_random_uuid() primary key,
  from_user text not null,
  to_user text not null,
  amount numeric not null,
  settled_at timestamptz default now()
);

create table app_settings (
  key text primary key,
  value text not null
);
