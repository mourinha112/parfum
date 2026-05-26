-- Imperial Parfum - Supabase schema
-- Rode este arquivo no SQL Editor do Supabase.

create table if not exists public.perfumes (
  id text primary key,
  name text not null,
  brand text not null,
  description text not null default '',
  image_url text not null default '',
  stock integer not null default 0 check (stock >= 0),
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12, 2) not null default 0 check (sale_price >= 0),
  markup_percent numeric(8, 2) not null default 0 check (markup_percent >= 0),
  volume_ml integer not null default 100 check (volume_ml > 0),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

notify pgrst, 'reload schema';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_perfumes_updated_at on public.perfumes;
create trigger set_perfumes_updated_at
before update on public.perfumes
for each row
execute function public.set_updated_at();

alter table public.perfumes enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Anyone can read perfumes" on public.perfumes;
create policy "Anyone can read perfumes"
on public.perfumes
for select
using (true);

drop policy if exists "Admins can insert perfumes" on public.perfumes;
create policy "Admins can insert perfumes"
on public.perfumes
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update perfumes" on public.perfumes;
create policy "Admins can update perfumes"
on public.perfumes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete perfumes" on public.perfumes;
create policy "Admins can delete perfumes"
on public.perfumes
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read own admin row" on public.admin_users;
create policy "Admins can read own admin row"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

insert into public.perfumes (
  id,
  name,
  brand,
  description,
  image_url,
  stock,
  cost_price,
  sale_price,
  markup_percent,
  volume_ml,
  featured
) values
  (
    'club-de-nuit-intense',
    'Club de Nuit Intense',
    'Armaf',
    'Amadeirado aromatico marcante. Notas de abacaxi, maca preta, bergamota, jasmim, rosa, almíscar, ambar e baunilha. Fixacao intensa.',
    'https://armaf.com/cdn/shop/files/Q-106DCLUBDENUITINTENSE_M_FIF_900x_f04752b1-087d-4206-8985-e13e96c5896d.webp?v=1762289750&width=900',
    10,
    180,
    350,
    94.44,
    100,
    true
  ),
  (
    'club-de-nuit-maleka',
    'Club de Nuit Maleka',
    'Armaf',
    'Floral frutal feminino sofisticado. Lichia, bergamota, pimenta rosa, iris, praline, ambroxan e sandalo. Presenca e docura equilibradas.',
    'https://armaf.com/cdn/shop/files/CDNMALEKA_900x_678cfb46-d6f1-4ca5-8c50-b3c2b439ce5d.webp?v=1762298770&width=900',
    8,
    180,
    350,
    94.44,
    100,
    true
  ),
  (
    'yara-preto',
    'Yara Preto',
    'Lattafa',
    'Floral doce envolvente. Bergamota, tangerina, flores brancas, jasmim e fundo amadeirado. Elegancia noturna.',
    'https://intimamentebella.com/cdn/shop/files/dot-made-stock-images._008-600x600.jpg?v=1706892388&width=1946',
    15,
    95,
    200,
    110.53,
    100,
    false
  ),
  (
    'atheeri',
    'Atheeri',
    'Lattafa',
    'Gourmand floral etereo. Abacaxi, flor da paixao, jasmim, praline, baunilha e sandalo. Delicado e marcante ao mesmo tempo.',
    'https://www.lattafa-usa.com/cdn/shop/files/Atheeri-1_f93156cf-73d9-4455-8540-5665a4312efb.png?v=1747416765&width=1946',
    6,
    260,
    550,
    111.54,
    100,
    true
  ),
  (
    'afeef',
    'Afeef',
    'Lattafa',
    'Floral amadeirado luxuoso. Pessego, pimenta rosa, bergamota, tuberosa, flor de laranjeira, jasmim, ambar e sandalo.',
    'https://www.lattafa-usa.com/cdn/shop/files/Afeef-1.png?v=1747414788&width=1946',
    5,
    280,
    590,
    110.71,
    100,
    false
  )
on conflict (id) do update
set
  name = excluded.name,
  brand = excluded.brand,
  description = excluded.description,
  image_url = excluded.image_url,
  stock = excluded.stock,
  cost_price = excluded.cost_price,
  sale_price = excluded.sale_price,
  markup_percent = excluded.markup_percent,
  volume_ml = excluded.volume_ml,
  featured = excluded.featured;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'perfume-images',
  'perfume-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public perfume images are readable" on storage.objects;
create policy "Public perfume images are readable"
on storage.objects
for select
using (bucket_id = 'perfume-images');

drop policy if exists "Admins can upload perfume images" on storage.objects;
create policy "Admins can upload perfume images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'perfume-images'
  and public.is_admin()
);

drop policy if exists "Admins can update perfume images" on storage.objects;
create policy "Admins can update perfume images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'perfume-images'
  and public.is_admin()
)
with check (
  bucket_id = 'perfume-images'
  and public.is_admin()
);

drop policy if exists "Admins can delete perfume images" on storage.objects;
create policy "Admins can delete perfume images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'perfume-images'
  and public.is_admin()
);

-- Depois de criar o usuario admin em Authentication > Users,
-- rode o arquivo supabase/make-admin.sql ou execute:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'seu-email@dominio.com'
-- on conflict (user_id) do nothing;
