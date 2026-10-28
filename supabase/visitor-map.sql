-- Apply once to tdzidbkqieqlyuxgoydk as migration add_shared_audience_map.
-- One browser contributes one coarse dot, which it can refine after consent. No IP, email, city, GPS
-- coordinate, client UUID or visit timestamp is retained. The random browser
-- identifier is hashed server-side solely to avoid counting reloads as people.
create table if not exists public.audience_locations (
  visitor_hash text primary key check (visitor_hash ~ '^[a-f0-9]{64}$'),
  latitude smallint not null check (latitude between -89 and 89 and mod(latitude, 2) <> 0),
  longitude smallint not null check (longitude between -179 and 179 and mod(longitude, 2) <> 0),
  country text check (country is null or country ~ '^[A-Z]{2}$')
);
alter table public.audience_locations enable row level security;
revoke all on table public.audience_locations from public, anon, authenticated;
-- Base records are never exposed to anonymous callers. A browser can place or
-- refine its own dot by presenting its unguessable, server-hashed identifier.
create or replace function public.jxxmal_place_audience_dot(
  p_visitor_hash text, p_latitude numeric, p_longitude numeric, p_country text default null
) returns void
language plpgsql security definer set search_path = '' set statement_timeout = '2s'
as $function$
declare
  coarse_latitude smallint;
  coarse_longitude smallint;
begin
  if p_visitor_hash is null or p_visitor_hash !~ '^[a-f0-9]{64}$'
    or p_latitude is null or p_latitude not between -90 and 90
    or p_longitude is null or p_longitude not between -180 and 180
    or (p_country is not null and p_country !~ '^[A-Z]{2}$') then
    raise exception 'Invalid audience location' using errcode = '22023';
  end if;
  -- Quantize again at the database boundary, including direct RPC callers.
  coarse_latitude := least(89, floor((p_latitude + 90) / 2) * 2 - 89)::smallint;
  coarse_longitude := least(179, floor((p_longitude + 180) / 2) * 2 - 179)::smallint;
  insert into public.audience_locations as existing (visitor_hash, latitude, longitude, country)
  values (p_visitor_hash, coarse_latitude, coarse_longitude, p_country)
  on conflict (visitor_hash) do update
    set latitude = excluded.latitude, longitude = excluded.longitude, country = excluded.country
    where existing.latitude is distinct from excluded.latitude
       or existing.longitude is distinct from excluded.longitude
       or existing.country is distinct from excluded.country;
end
$function$;
revoke all on function public.jxxmal_place_audience_dot(text, numeric, numeric, text) from public, anon, authenticated;
grant execute on function public.jxxmal_place_audience_dot(text, numeric, numeric, text) to anon;

-- Intentional public aggregate endpoint: elevated reads expose grouped 2° grid
-- cells only. No row identifier or country is returned and no caller-supplied
-- SQL, filter, limit or ordering is accepted. Base rows remain unreadable.
create or replace function public.jxxmal_audience_map()
returns table (latitude smallint, longitude smallint, visitors bigint)
language sql stable security definer set search_path = ''
as $function$
  select location.latitude, location.longitude, count(*)
  from public.audience_locations as location
  group by location.latitude, location.longitude
  order by location.latitude, location.longitude
  limit 16200
$function$;
revoke all on function public.jxxmal_audience_map() from public, anon, authenticated;
grant execute on function public.jxxmal_audience_map() to anon;
