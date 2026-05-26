# Imperial Parfum

Catalogo de perfumes + painel administrativo em Next.js 15.

O app agora esta pronto para usar Supabase em producao:

- Supabase Auth para login do admin.
- Tabela `perfumes` para cadastro de nome, marca, descricao, foto, estoque, custo, preco de venda, percentual de precificacao e volume.
- Supabase Storage para upload de fotos.
- RLS liberando leitura publica do catalogo e escrita apenas para usuarios marcados como admin.

Sem variaveis de Supabase o projeto continua rodando em modo local com `localStorage`, util para desenvolvimento.

## Como rodar local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e rode o arquivo `supabase/schema.sql`.
3. Em Authentication > Users, crie o usuario admin com e-mail e senha.
4. No SQL Editor, rode o arquivo `supabase/make-admin.sql` trocando o e-mail.
   O resultado precisa mostrar `is_admin = true`.

Ou rode direto:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'seu-email@dominio.com'
on conflict (user_id) do nothing;
```

5. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Depois reinicie `npm run dev`.

## Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Na Vercel, importe o repositorio como projeto Next.js.
3. Em Settings > Environment Variables, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Faça o deploy.

Supabase nao atrapalha a Vercel: a Vercel hospeda o site e o Supabase fornece banco, login e storage.

## Admin

Com Supabase configurado, acesse `/admin` e entre com o e-mail/senha criados no Supabase Auth.

No painel admin voce pode:

- cadastrar, editar e excluir perfumes;
- enviar foto para o Supabase Storage ou informar uma URL de imagem;
- controlar estoque;
- informar preco de custo;
- definir percentual de precificacao, que calcula o preco de venda;
- ajustar preco de venda manualmente, recalculando o markup;
- ver margem de lucro e lucro potencial do estoque.

Se o upload de foto falhar, rode `supabase/storage-setup.sql` no SQL Editor do Supabase.

## Arquivos-chave

- `app/page.tsx` - catalogo publico
- `app/admin/page.tsx` - painel admin
- `lib/supabase.ts` - client Supabase
- `lib/supabase-perfumes.ts` - Auth, CRUD e upload
- `lib/storage.ts` - fallback local
- `lib/types.ts` - tipos e calculos financeiros
- `supabase/schema.sql` - schema completo do Supabase
