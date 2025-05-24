-- Enable RLS (Row Level Security)
alter table auth.users enable row level security;

-- Create user_profiles table
create table public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Create podcasts table
create table public.podcasts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  host_name text not null,
  category text not null,
  script text not null,
  voice_id text not null,
  voice_name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  audio_url text,
  duration integer, -- duration in seconds
  listens integer default 0,
  featured boolean default false,
  description text
);

-- Create indexes
create index podcasts_user_id_idx on public.podcasts(user_id);
create index podcasts_created_at_idx on public.podcasts(created_at desc);
create index podcasts_featured_idx on public.podcasts(featured);
create index podcasts_category_idx on public.podcasts(category);

-- Enable RLS on tables
alter table public.user_profiles enable row level security;
alter table public.podcasts enable row level security;

-- Create RLS policies for user_profiles
create policy "Users can view their own profile" on public.user_profiles
  for select using (auth.uid() = user_id);

create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert their own profile" on public.user_profiles
  for insert with check (auth.uid() = user_id);

-- Create RLS policies for podcasts
create policy "Users can view all podcasts" on public.podcasts
  for select using (true);

create policy "Users can insert their own podcasts" on public.podcasts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own podcasts" on public.podcasts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own podcasts" on public.podcasts
  for delete using (auth.uid() = user_id);

-- Create function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.podcasts
  for each row execute procedure public.handle_updated_at();
