-- 20260405_profile_display_name_sync.sql

-- Keep profiles.full_name aligned with auth.users metadata at signup time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_full_name text;
  resolved_role text;
begin
  resolved_full_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(trim(concat_ws(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name')), ''),
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );

  resolved_role := case
    when lower(coalesce(new.raw_user_meta_data->>'role', 'user')) = 'analyst' then 'analyst'
    else 'user'
  end;

  insert into public.profiles (id, full_name, role)
  values (new.id, resolved_full_name, resolved_role);

  return new;
end;
$$;

-- Backfill existing profiles that don't yet have full_name.
update public.profiles p
set full_name = coalesce(
  nullif(u.raw_user_meta_data->>'display_name', ''),
  nullif(u.raw_user_meta_data->>'full_name', ''),
  nullif(u.raw_user_meta_data->>'name', ''),
  nullif(trim(concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name')), ''),
  nullif(u.raw_user_meta_data->>'username', ''),
  split_part(u.email, '@', 1)
)
from auth.users u
where p.id = u.id
  and (p.full_name is null or trim(p.full_name) = '');

update public.profiles p
set role = case
  when lower(coalesce(u.raw_user_meta_data->>'role', 'user')) = 'analyst' then 'analyst'
  else 'user'
end
from auth.users u
where p.id = u.id
  and (p.role is null or p.role not in ('user', 'analyst'));