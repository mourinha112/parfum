-- Troque o e-mail abaixo pelo e-mail criado em Authentication > Users.
-- Rode no SQL Editor do Supabase depois de criar o usuario.

insert into public.admin_users (user_id)
select id
from auth.users
where email = 'seu-email@dominio.com'
on conflict (user_id) do nothing;
