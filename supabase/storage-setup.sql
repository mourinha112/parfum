-- Imperial Parfum - Supabase Storage setup
-- Rode este arquivo no SQL Editor se o upload de fotos do admin falhar.

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

notify pgrst, 'reload schema';
