"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  deleteSupabasePerfume,
  fetchSupabasePerfumes,
  getAdminStatus,
  replaceSupabasePerfumes,
  signInSupabaseAdmin,
  signOutSupabaseAdmin,
  uploadPerfumeImage,
  upsertSupabasePerfume,
} from "@/lib/supabase-perfumes";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  isAuthed,
  loadPerfumes,
  resetPerfumes,
  savePerfumes,
  signIn,
  signOut,
  slugify,
} from "@/lib/storage";
import {
  formatBRL,
  markup,
  normalizePerfume,
  profitMargin,
  roundMoney,
  salePriceFromMarkup,
  type Perfume,
} from "@/lib/types";

type Draft = Omit<Perfume, "id"> & { id?: string };

const emptyDraft: Draft = {
  name: "",
  brand: "",
  description: "",
  imageUrl: "",
  stock: 0,
  costPrice: 0,
  salePrice: 0,
  markupPercent: 100,
  volumeMl: 100,
  featured: false,
};

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Nao foi possivel concluir a operacao.";
}

function sortPerfumes(list: Perfume[]): Perfume[] {
  return [...list].sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [usesSupabase, setUsesSupabase] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function boot() {
      const configured = isSupabaseConfigured();
      setUsesSupabase(configured);

      try {
        if (configured) {
          const [status, list] = await Promise.all([
            getAdminStatus(),
            fetchSupabasePerfumes(),
          ]);
          if (!active) return;
          setAuthed(status.authed);
          setEmail(status.email);
          setPerfumes(sortPerfumes(list));
        } else {
          setAuthed(isAuthed());
          setPerfumes(sortPerfumes(loadPerfumes()));
        }
      } catch (err) {
        if (!active) return;
        setError(messageFromError(err));
        setAuthed(configured ? false : isAuthed());
        setPerfumes(sortPerfumes(loadPerfumes()));
      } finally {
        if (active) setReady(true);
      }
    }

    boot();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const stockValueCost = perfumes.reduce(
      (acc, p) => acc + p.costPrice * p.stock,
      0,
    );
    const stockValueSale = perfumes.reduce(
      (acc, p) => acc + p.salePrice * p.stock,
      0,
    );
    const units = perfumes.reduce((acc, p) => acc + p.stock, 0);
    const potentialProfit = stockValueSale - stockValueCost;
    return { stockValueCost, stockValueSale, units, potentialProfit };
  }, [perfumes]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      if (usesSupabase) {
        const status = await signInSupabaseAdmin(email, password);
        setAuthed(status.authed);
        setEmail(status.email);
        setPerfumes(sortPerfumes(await fetchSupabasePerfumes()));
      } else if (signIn(password)) {
        setAuthed(true);
      } else {
        throw new Error("Senha incorreta.");
      }
      setPassword("");
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (usesSupabase) {
      await signOutSupabaseAdmin();
    } else {
      signOut();
    }

    setAuthed(false);
    setPassword("");
  }

  function persistLocal(list: Perfume[]) {
    const sorted = sortPerfumes(list);
    savePerfumes(sorted);
    setPerfumes(sorted);
  }

  function startEdit(p: Perfume) {
    setEditingId(p.id);
    setDraft({ ...p });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function updateCostPrice(value: number) {
    setDraft((current) => ({
      ...current,
      costPrice: value,
      salePrice: salePriceFromMarkup(value, current.markupPercent),
    }));
  }

  function updateMarkupPercent(value: number) {
    setDraft((current) => ({
      ...current,
      markupPercent: value,
      salePrice: salePriceFromMarkup(current.costPrice, value),
    }));
  }

  function updateSalePrice(value: number) {
    setDraft((current) => ({
      ...current,
      salePrice: value,
      markupPercent: roundMoney(markup(current.costPrice, value)),
    }));
  }

  function buildPerfume(id: string): Perfume {
    return normalizePerfume({
      ...draft,
      id,
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim(),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!draft.name.trim() || !draft.brand.trim()) {
      setError("Informe nome e marca do perfume.");
      return;
    }

    setSaving(true);

    try {
      const baseId = slugify(`${draft.brand}-${draft.name}`) || crypto.randomUUID();
      const nextId =
        editingId ?? (perfumes.some((p) => p.id === baseId) ? `${baseId}-${Date.now()}` : baseId);
      const nextPerfume = buildPerfume(nextId);

      if (usesSupabase) {
        const saved = await upsertSupabasePerfume(nextPerfume);
        setPerfumes((current) =>
          sortPerfumes(
            editingId
              ? current.map((p) => (p.id === editingId ? saved : p))
              : [...current, saved],
          ),
        );
      } else {
        persistLocal(
          editingId
            ? perfumes.map((p) => (p.id === editingId ? nextPerfume : p))
            : [...perfumes, nextPerfume],
        );
      }

      setNotice(editingId ? "Perfume atualizado." : "Perfume cadastrado.");
      cancelEdit();
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este perfume?")) return;
    setError("");
    setNotice("");
    setSaving(true);

    try {
      if (usesSupabase) await deleteSupabasePerfume(id);
      const next = perfumes.filter((p) => p.id !== id);
      if (usesSupabase) setPerfumes(next);
      else persistLocal(next);
      if (editingId === id) cancelEdit();
      setNotice("Perfume excluido.");
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("Restaurar os 5 perfumes iniciais? Isso apaga alteracoes."))
      return;

    setError("");
    setNotice("");
    setSaving(true);

    try {
      const seed = usesSupabase ? await replaceSupabasePerfumes() : resetPerfumes();
      setPerfumes(sortPerfumes(seed));
      cancelEdit();
      setNotice("Catalogo inicial restaurado.");
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    setError("");
    setNotice("");

    if (!usesSupabase) {
      setError("Upload de foto exige Supabase configurado. Use a URL da imagem neste modo.");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadPerfumeImage(file);
      setDraft((current) => ({ ...current, imageUrl }));
      setNotice("Foto enviada para o Supabase Storage.");
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setUploadingImage(false);
    }
  }

  if (!ready) return null;

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="card rounded-2xl p-8 w-full max-w-sm space-y-6"
        >
          <div className="flex justify-center">
            <Logo size="sm" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-serif gold-gradient">
              Painel Administrativo
            </h1>
            <p className="text-xs text-neutral-500 mt-2 tracking-wide">
              {usesSupabase ? "Login via Supabase Auth" : "Modo local"}
            </p>
          </div>

          {usesSupabase && (
            <Field label="E-mail">
              <input
                type="email"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </Field>
          )}

          <Field label="Senha">
            <input
              type="password"
              className="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={usesSupabase ? "current-password" : "off"}
              autoFocus={!usesSupabase}
              required
            />
          </Field>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            className="btn-gold w-full py-3 rounded-lg disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Entrando..." : "Entrar"}
          </button>
          <Link
            href="/"
            className="block text-center text-[11px] uppercase tracking-widest text-neutral-500 hover:text-gold-500"
          >
            Voltar ao catalogo
          </Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div>
              <h1 className="text-xl md:text-2xl font-serif text-white">
                Painel <span className="gold-gradient">Admin</span>
              </h1>
              <p className="text-[11px] text-neutral-500 tracking-widest uppercase">
                {usesSupabase ? "Supabase conectado" : "Modo local"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="btn-outline px-4 py-2 rounded-lg text-xs uppercase tracking-widest"
            >
              Ver catalogo
            </Link>
            <button
              onClick={handleLogout}
              className="btn-outline px-4 py-2 rounded-lg text-xs uppercase tracking-widest"
            >
              Sair
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-500/30 bg-red-950/20 text-red-200"
                : "border-gold-500/30 bg-gold-500/10 text-gold-100"
            }`}
          >
            {error || notice}
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
          <StatCard label="Itens no estoque" value={totals.units.toString()} />
          <StatCard
            label="Valor em estoque (custo)"
            value={formatBRL(totals.stockValueCost)}
          />
          <StatCard
            label="Valor em estoque (venda)"
            value={formatBRL(totals.stockValueSale)}
            highlight
          />
          <StatCard
            label="Lucro potencial"
            value={formatBRL(totals.potentialProfit)}
            highlight
          />
        </section>

        <section className="card rounded-2xl p-6 mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-serif text-white">
              {editingId ? "Editar perfume" : "Novo perfume"}
            </h2>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="text-xs uppercase tracking-widest text-neutral-500 hover:text-gold-500"
              >
                Cancelar edicao
              </button>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label="Nome">
              <input
                className="w-full"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Marca">
              <input
                className="w-full"
                value={draft.brand}
                onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                required
              />
            </Field>
            <Field label="Foto" className="md:col-span-2">
              <div className="grid gap-3 md:grid-cols-[120px_1fr] md:items-center">
                <div className="relative h-32 w-full md:w-28 rounded-lg bg-night-800 border border-gold-500/10 overflow-hidden flex items-center justify-center">
                  {draft.imageUrl ? (
                    <img
                      src={draft.imageUrl}
                      alt={draft.name || "Foto do perfume"}
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-neutral-600">
                      Sem foto
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    className="w-full"
                    value={draft.imageUrl}
                    onChange={(e) =>
                      setDraft({ ...draft, imageUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full"
                    onChange={handleImageUpload}
                    disabled={!usesSupabase || uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="text-xs text-neutral-500">Enviando foto...</p>
                  )}
                </div>
              </div>
            </Field>
            <Field label="Descricao" className="md:col-span-2">
              <textarea
                className="w-full min-h-[90px]"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
            <Field label="Volume (ml)">
              <input
                type="number"
                min={1}
                className="w-full"
                value={draft.volumeMl}
                onChange={(e) =>
                  setDraft({ ...draft, volumeMl: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Estoque (un.)">
              <input
                type="number"
                min={0}
                className="w-full"
                value={draft.stock}
                onChange={(e) =>
                  setDraft({ ...draft, stock: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Valor de custo (R$)">
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full"
                value={draft.costPrice}
                onChange={(e) => updateCostPrice(Number(e.target.value))}
              />
            </Field>
            <Field label="Precificacao (%)">
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full"
                value={draft.markupPercent}
                onChange={(e) => updateMarkupPercent(Number(e.target.value))}
              />
            </Field>
            <Field label="Valor de venda (R$)">
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full"
                value={draft.salePrice}
                onChange={(e) => updateSalePrice(Number(e.target.value))}
              />
            </Field>
            <Field label="Margem calculada">
              <div className="flex items-center gap-2 px-3 py-[0.65rem] rounded-lg bg-night-800 border border-gold-500/20 text-sm">
                <span className="gold-gradient font-semibold">
                  {profitMargin(draft.costPrice, draft.salePrice).toFixed(1)}%
                </span>
                <span className="text-neutral-600">/</span>
                <span className="text-neutral-400 text-xs">
                  markup {markup(draft.costPrice, draft.salePrice).toFixed(1)}%
                </span>
              </div>
            </Field>
            <label className="md:col-span-2 flex items-center gap-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                className="w-4 h-4 accent-gold-500"
                checked={!!draft.featured}
                onChange={(e) =>
                  setDraft({ ...draft, featured: e.target.checked })
                }
              />
              Exibir com selo de destaque na vitrine
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="btn-gold px-6 py-3 rounded-lg disabled:opacity-60"
                disabled={saving || uploadingImage}
              >
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alteracoes"
                    : "Adicionar perfume"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-outline px-6 py-3 rounded-lg text-xs uppercase tracking-widest"
                disabled={saving}
              >
                Restaurar inicial
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-serif text-white mb-4">
            Perfumes cadastrados
          </h2>

          <div className="hidden md:block card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-night-700 text-gold-500/80 text-[11px] uppercase tracking-widest">
                <tr>
                  <th className="text-left p-4">Produto</th>
                  <th className="text-right p-4">Estoque</th>
                  <th className="text-right p-4">Custo</th>
                  <th className="text-right p-4">Markup</th>
                  <th className="text-right p-4">Venda</th>
                  <th className="text-right p-4">Margem</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {perfumes.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-gold-500/5 hover:bg-night-700/40"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-night-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="absolute inset-0 h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-[8px] uppercase tracking-widest text-neutral-600">
                              Foto
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white">{p.name}</p>
                          <p className="text-[11px] text-neutral-500 uppercase tracking-widest">
                            {p.brand} / {p.volumeMl}ml
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right p-4">
                      <span
                        className={
                          p.stock === 0
                            ? "text-red-400"
                            : p.stock < 5
                              ? "text-amber-400"
                              : "text-white"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="text-right p-4 text-neutral-400">
                      {formatBRL(p.costPrice)}
                    </td>
                    <td className="text-right p-4 text-neutral-400">
                      {p.markupPercent.toFixed(1)}%
                    </td>
                    <td className="text-right p-4 text-white">
                      {formatBRL(p.salePrice)}
                    </td>
                    <td className="text-right p-4 gold-gradient font-semibold">
                      {profitMargin(p.costPrice, p.salePrice).toFixed(1)}%
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="btn-outline px-3 py-1.5 rounded-md text-[11px] uppercase tracking-widest"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-3 py-1.5 rounded-md text-[11px] uppercase tracking-widest border border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {perfumes.map((p) => (
              <div key={p.id} className="card rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-lg bg-night-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[8px] uppercase tracking-widest text-neutral-600">
                        Foto
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-gold-500/70">
                      {p.brand} / {p.volumeMl}ml
                    </p>
                    <p className="text-white truncate">{p.name}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div>
                        <p className="text-neutral-500">Estoque</p>
                        <p className="text-white">{p.stock}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Venda</p>
                        <p className="text-white">{formatBRL(p.salePrice)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Markup</p>
                        <p className="gold-gradient font-semibold">
                          {p.markupPercent.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => startEdit(p)}
                    className="btn-outline flex-1 py-2 rounded-md text-[11px] uppercase tracking-widest"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex-1 py-2 rounded-md text-[11px] uppercase tracking-widest border border-red-500/30 text-red-400"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="card rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-2 text-lg md:text-xl font-serif ${
          highlight ? "gold-gradient font-semibold" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-[11px] uppercase tracking-widest text-gold-500/80">
        {label}
      </span>
      {children}
    </label>
  );
}
