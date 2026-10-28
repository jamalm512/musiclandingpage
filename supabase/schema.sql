-- Target project: tdzidbkqieqlyuxgoydk (Music Landing Page).
-- One DO statement is atomic without introducing BEGIN/COMMIT boundaries into
-- the migration runner. It changes schema/access only; no subscriber rows are
-- updated or deleted. Duplicate normalized (email, source) rows make index
-- creation fail before legacy uniqueness or access rules are changed.
do $signup_schema$
begin
  create table if not exists public.subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null check (
      char_length(email) <= 254
      and email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'
    ),
    source text not null default 'inner_circle' check (
      source in ('inner_circle', 'bounce_notify')
    ),
    created_at timestamptz not null default now()
  );

  -- Preserve the old guarantee until the stronger, list-specific key exists.
  create unique index if not exists subscribers_email_source_unique
    on public.subscribers (lower(btrim(email)), source);
  alter table public.subscribers
    drop constraint if exists subscribers_email_key;

  alter table public.subscribers enable row level security;
  -- Permissive policies are ORed together: remove the audited unrestricted one
  -- rather than adding a stricter rule beside it.
  drop policy if exists "Allow anonymous inserts" on public.subscribers;
  drop policy if exists "Website signup insert" on public.subscribers;
  revoke all on table public.subscribers from public, anon, authenticated;
  grant insert (email, source) on public.subscribers to anon;
  create policy "Website signup insert" on public.subscribers
    for insert to anon
    with check (
      source in ('inner_circle', 'bounce_notify')
      and email = lower(btrim(email))
      and char_length(email) <= 254
      and email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'
    );
end
$signup_schema$;
