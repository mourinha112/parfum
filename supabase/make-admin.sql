-- Troque o e-mail abaixo pelo e-mail criado em Authentication > Users.
-- Rode no SQL Editor do Supabase depois de criar o usuario.

do $$
declare
  admin_email text := 'seu-email@dominio.com';
  admin_id uuid;
begin
  select id
  into admin_id
  from auth.users
  where lower(email) = lower(admin_email);

  if admin_id is null then
    raise exception 'Usuario % nao encontrado em Authentication > Users neste projeto Supabase.', admin_email;
  end if;

  insert into public.admin_users (user_id)
  values (admin_id)
  on conflict (user_id) do nothing;

  raise notice 'Admin liberado: % / %', admin_email, admin_id;
end $$;

select
  users.id,
  users.email,
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = users.id
  ) as is_admin
from auth.users
where lower(users.email) = lower('seu-email@dominio.com');
