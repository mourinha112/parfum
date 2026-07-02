"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import PerfumeCard from "@/components/PerfumeCard";
import PerfumeModal from "@/components/PerfumeModal";
import { fetchSupabasePerfumes } from "@/lib/supabase-perfumes";
import { isSupabaseConfigured } from "@/lib/supabase";
import { loadPerfumes } from "@/lib/storage";
import { formatBRL, type Perfume } from "@/lib/types";
import { SEED_PERFUMES } from "@/lib/seed";
import { STORE_NAME, whatsappUrl } from "@/lib/config";

type PriceFilter = "all" | "under250" | "250to450" | "over450";
type StockFilter = "all" | "available" | "lastUnits";
type SortOption = "featured" | "priceAsc" | "priceDesc" | "name";
type BagItem = {
  perfume: Perfume;
  quantity: number;
};

const scentOptions = ["Floral", "Doce", "Frutal", "Amadeirado", "Gourmand"];

function getScentProfile(perfume: Perfume) {
  const text = `${perfume.name} ${perfume.description}`.toLowerCase();
  const profiles = [
    { label: "Floral", terms: ["floral", "flor", "jasmim", "rosa", "tuberosa"] },
    { label: "Doce", terms: ["doce", "baunilha", "praline", "praline", "ambar"] },
    { label: "Frutal", terms: ["frutal", "abacaxi", "lichia", "pessego", "tangerina", "maca"] },
    { label: "Amadeirado", terms: ["amadeirado", "sandalo", "madeira"] },
    { label: "Gourmand", terms: ["gourmand", "praline", "baunilha"] },
  ];

  return profiles
    .filter((profile) => profile.terms.some((term) => text.includes(term)))
    .map((profile) => profile.label);
}

function matchesPrice(perfume: Perfume, priceFilter: PriceFilter) {
  if (priceFilter === "under250") return perfume.salePrice < 250;
  if (priceFilter === "250to450") {
    return perfume.salePrice >= 250 && perfume.salePrice <= 450;
  }
  if (priceFilter === "over450") return perfume.salePrice > 450;
  return true;
}

function matchesStock(perfume: Perfume, stockFilter: StockFilter) {
  if (stockFilter === "available") return perfume.stock > 0;
  if (stockFilter === "lastUnits") return perfume.stock > 0 && perfume.stock <= 3;
  return true;
}

export default function HomePage() {
  const [perfumes, setPerfumes] = useState<Perfume[]>(SEED_PERFUMES);
  const [selected, setSelected] = useState<Perfume | null>(null);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [scent, setScent] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("available");
  const [sort, setSort] = useState<SortOption>("featured");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [bag, setBag] = useState<BagItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const data = isSupabaseConfigured()
          ? await fetchSupabasePerfumes()
          : loadPerfumes();
        if (active) setPerfumes(data);
      } catch {
        if (active) setPerfumes(loadPerfumes());
      }
    }

    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(perfumes.map((perfume) => perfume.brand))).sort(),
    [perfumes]
  );

  const filteredPerfumes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return perfumes
      .filter((perfume) => {
        const searchable = `${perfume.name} ${perfume.brand} ${perfume.description}`.toLowerCase();
        const scentProfiles = getScentProfile(perfume);

        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (brand === "all" || perfume.brand === brand) &&
          (scent === "all" || scentProfiles.includes(scent)) &&
          matchesPrice(perfume, priceFilter) &&
          matchesStock(perfume, stockFilter) &&
          (!featuredOnly || perfume.featured)
        );
      })
      .sort((a, b) => {
        if (sort === "priceAsc") return a.salePrice - b.salePrice;
        if (sort === "priceDesc") return b.salePrice - a.salePrice;
        if (sort === "name") return a.name.localeCompare(b.name);
        return Number(b.featured) - Number(a.featured) || b.stock - a.stock;
      });
  }, [brand, featuredOnly, perfumes, priceFilter, query, scent, sort, stockFilter]);

  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);
  const bagTotal = bag.reduce(
    (sum, item) => sum + item.perfume.salePrice * item.quantity,
    0
  );
  const activeFilterCount = [
    brand !== "all",
    scent !== "all",
    priceFilter !== "all",
    stockFilter !== "available",
    featuredOnly,
  ].filter(Boolean).length;

  function addToBag(perfume: Perfume) {
    if (perfume.stock <= 0) return;
    setBag((current) => {
      const existing = current.find((item) => item.perfume.id === perfume.id);
      if (existing) {
        return current.map((item) =>
          item.perfume.id === perfume.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.perfume.stock),
              }
            : item
        );
      }
      return [...current, { perfume, quantity: 1 }];
    });
    setBagOpen(true);
  }

  function removeFromBag(perfumeId: string) {
    setBag((current) => current.filter((item) => item.perfume.id !== perfumeId));
  }

  function updateBagQuantity(perfumeId: string, quantity: number) {
    setBag((current) =>
      current.map((item) =>
        item.perfume.id === perfumeId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.perfume.stock)),
            }
          : item
      )
    );
  }

  function resetFilters() {
    setQuery("");
    setBrand("all");
    setScent("all");
    setPriceFilter("all");
    setStockFilter("available");
    setSort("featured");
    setFeaturedOnly(false);
  }

  const singleProductMessage = (perfume: Perfume) =>
    `Ola, ${STORE_NAME}! Vim pelo site e quero comprar o perfume ${perfume.name} (${perfume.brand}) por ${formatBRL(perfume.salePrice)}. Pode confirmar disponibilidade e entrega?`;

  const bagMessage = `Ola, ${STORE_NAME}! Vim pelo site e quero fechar esta compra:\n${bag
    .map(
      (item) =>
        `- ${item.quantity}x ${item.perfume.name} (${item.perfume.brand}) - ${formatBRL(
          item.perfume.salePrice * item.quantity
        )}`
    )
    .join("\n")}\nTotal: ${formatBRL(bagTotal)}\nPode confirmar disponibilidade e entrega?`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.11),transparent_34rem),linear-gradient(180deg,#070707_0%,#101010_48%,#050505_100%)]">
      <div className="border-b border-white/10 bg-[#101010] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
        Pronta entrega | Atendimento via WhatsApp | Envio para todo o Brasil
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Logo size="sm" />
          </Link>

          <label className="relative hidden flex-1 md:block">
            <span className="sr-only">Buscar perfume</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por perfume, marca ou nota"
              className="w-full rounded-full border-white/10 bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500"
            />
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="m21 21-4.3-4.3" />
              <circle cx="11" cy="11" r="8" />
            </svg>
          </label>

          <nav className="ml-auto flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60 transition hover:border-gold-500/50 hover:text-gold-500 sm:inline-flex"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={() => setBagOpen((current) => !current)}
              className="relative inline-flex h-11 items-center gap-2 rounded-full bg-gold-500 px-4 text-sm font-extrabold text-black transition hover:bg-gold-300"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                aria-hidden
              >
                <path d="M6 8h12l-1 13H7L6 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
              Sacola
              {bagCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-black text-black">
                  {bagCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
          <label className="relative block">
            <span className="sr-only">Buscar perfume</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar perfume"
              className="w-full rounded-full border-white/10 bg-white/[0.06] py-3 pl-10 pr-4 text-sm"
            />
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="m21 21-4.3-4.3" />
              <circle cx="11" cy="11" r="8" />
            </svg>
          </label>
        </div>
      </header>

      <section className="border-b border-white/10 px-4 py-8 md:py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-200">
              Loja online de perfumes arabes
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-black leading-[1.02] text-white md:text-6xl">
                Fragrancias importadas para escolher e comprar no WhatsApp.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-300 md:text-base">
                Compare marcas, faixa de preco, estoque e perfil olfativo antes
                de chamar a Imperial Parfum.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {scentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScent(option)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                    scent === option
                      ? "border-gold-500 bg-gold-500 text-black"
                      : "border-white/10 bg-white/[0.04] text-white/70 hover:border-gold-500/40 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="rounded-xl bg-black/50 p-4">
              <p className="text-2xl font-black text-white">{perfumes.length}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                Produtos
              </p>
            </div>
            <div className="rounded-xl bg-black/50 p-4">
              <p className="text-2xl font-black text-white">
                {perfumes.filter((perfume) => perfume.stock > 0).length}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                Em estoque
              </p>
            </div>
            <div className="rounded-xl bg-black/50 p-4">
              <p className="text-2xl font-black text-white">
                {perfumes.filter((perfume) => perfume.featured).length}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                Destaques
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit lg:sticky lg:top-24 lg:block">
          <div className="rounded-2xl border border-white/10 bg-[#101010]/90 p-4 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                Filtros
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-500 hover:text-gold-300"
              >
                Limpar
              </button>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Marca
                </span>
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="w-full"
                >
                  <option value="all">Todas as marcas</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Perfil
                </span>
                <select
                  value={scent}
                  onChange={(event) => setScent(event.target.value)}
                  className="w-full"
                >
                  <option value="all">Todos os perfis</option>
                  {scentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Preco
                </span>
                <select
                  value={priceFilter}
                  onChange={(event) =>
                    setPriceFilter(event.target.value as PriceFilter)
                  }
                  className="w-full"
                >
                  <option value="all">Todos os precos</option>
                  <option value="under250">Ate R$ 250</option>
                  <option value="250to450">R$ 250 a R$ 450</option>
                  <option value="over450">Acima de R$ 450</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Estoque
                </span>
                <select
                  value={stockFilter}
                  onChange={(event) =>
                    setStockFilter(event.target.value as StockFilter)
                  }
                  className="w-full"
                >
                  <option value="all">Mostrar tudo</option>
                  <option value="available">Disponiveis</option>
                  <option value="lastUnits">Ultimas unidades</option>
                </select>
              </label>

              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-3">
                <span className="text-xs font-bold text-white">
                  Somente destaques
                </span>
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(event) => setFeaturedOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 p-0 accent-[#d4af37]"
                />
              </label>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 grid grid-cols-[1fr_150px] gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gold-500/35 bg-gold-500/10 px-4 text-sm font-black uppercase tracking-[0.12em] text-gold-200"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                aria-hidden
              >
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filtros
              {activeFilterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[10px] text-black">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-12 w-full min-w-0 rounded-xl text-xs font-bold"
              aria-label="Ordenar produtos"
            >
              <option value="featured">Destaques</option>
              <option value="priceAsc">Menor preco</option>
              <option value="priceDesc">Maior preco</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {brand !== "all" && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-white/80">
                  Marca: {brand}
                </span>
              )}
              {scent !== "all" && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-white/80">
                  Perfil: {scent}
                </span>
              )}
              {priceFilter !== "all" && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-white/80">
                  Preco filtrado
                </span>
              )}
              {stockFilter !== "available" && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-white/80">
                  Estoque filtrado
                </span>
              )}
              {featuredOnly && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-white/80">
                  Destaques
                </span>
              )}
            </div>
          )}

          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Vitrine
              </p>
              <h2 className="mt-1 text-xl font-black text-white md:text-2xl">
                {filteredPerfumes.length} perfume
                {filteredPerfumes.length === 1 ? "" : "s"} encontrado
                {filteredPerfumes.length === 1 ? "" : "s"}
              </h2>
            </div>
            <label className="hidden items-center gap-2 lg:flex">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                Ordenar
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="min-w-[180px]"
              >
                <option value="featured">Destaques primeiro</option>
                <option value="priceAsc">Menor preco</option>
                <option value="priceDesc">Maior preco</option>
                <option value="name">Nome A-Z</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPerfumes.map((perfume) => (
              <PerfumeCard
                key={perfume.id}
                perfume={perfume}
                onClick={(item) => setSelected(item)}
                onAddToBag={addToBag}
                buyHref={whatsappUrl(singleProductMessage(perfume))}
              />
            ))}
          </div>

          {filteredPerfumes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
              <h3 className="text-xl font-black text-white">
                Nenhum perfume encontrado
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">
                Ajuste os filtros para ver outras fragrancias disponiveis na
                loja.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-full bg-gold-500 px-5 py-3 text-sm font-black text-black transition hover:bg-gold-300"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="max-h-[82vh] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0b0b0b] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros da loja"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-500">
                  Loja
                </p>
                <h2 className="text-2xl font-black text-white">Filtros</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Fechar filtros"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Marca
                </span>
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="h-11 w-full min-w-0 text-xs"
                >
                  <option value="all">Todas</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Perfil
                </span>
                <select
                  value={scent}
                  onChange={(event) => setScent(event.target.value)}
                  className="h-11 w-full min-w-0 text-xs"
                >
                  <option value="all">Todos</option>
                  {scentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Preco
                </span>
                <select
                  value={priceFilter}
                  onChange={(event) =>
                    setPriceFilter(event.target.value as PriceFilter)
                  }
                  className="h-11 w-full min-w-0 text-xs"
                >
                  <option value="all">Todos</option>
                  <option value="under250">Ate R$ 250</option>
                  <option value="250to450">R$ 250 a R$ 450</option>
                  <option value="over450">Acima de R$ 450</option>
                </select>
              </label>

              <label className="min-w-0 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                  Estoque
                </span>
                <select
                  value={stockFilter}
                  onChange={(event) =>
                    setStockFilter(event.target.value as StockFilter)
                  }
                  className="h-11 w-full min-w-0 text-xs"
                >
                  <option value="all">Tudo</option>
                  <option value="available">Disponiveis</option>
                  <option value="lastUnits">Ultimas</option>
                </select>
              </label>
            </div>

            <label className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
              <span className="text-sm font-bold text-white">
                Somente destaques
              </span>
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(event) => setFeaturedOnly(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 p-0 accent-[#d4af37]"
              />
            </label>

            <div className="mt-4 grid grid-cols-[0.9fr_1.1fr] gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="h-12 rounded-xl border border-white/10 text-sm font-black uppercase tracking-[0.12em] text-white/70"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="h-12 rounded-xl bg-gold-500 text-sm font-black uppercase tracking-[0.12em] text-black"
              >
                Ver produtos
              </button>
            </div>
          </div>
        </div>
      )}

      {bagOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() => setBagOpen(false)}
        >
          <aside
            className="ml-auto flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b0b0b] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Sacola de compras"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-500">
                  Sua sacola
                </p>
                <h2 className="text-2xl font-black text-white">
                  {bagCount} item{bagCount === 1 ? "" : "s"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBagOpen(false)}
                aria-label="Fechar sacola"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-gold-500 hover:text-gold-500"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {bag.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
                  <p className="text-sm text-neutral-400">
                    Adicione perfumes para montar a mensagem de compra.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bag.map((item) => (
                    <div
                      key={item.perfume.id}
                      className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                        {item.perfume.imageUrl ? (
                          <img
                            src={item.perfume.imageUrl}
                            alt={item.perfume.name}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-white">
                              {item.perfume.name}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-gold-500">
                              {item.perfume.brand}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromBag(item.perfume.id)}
                            className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500 hover:text-red-300"
                          >
                            Remover
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-full border border-white/10 bg-black/50">
                            <button
                              type="button"
                              onClick={() =>
                                updateBagQuantity(
                                  item.perfume.id,
                                  item.quantity - 1
                                )
                              }
                              className="grid h-8 w-8 place-items-center text-white/70 hover:text-white"
                              aria-label="Diminuir quantidade"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-sm font-black text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateBagQuantity(
                                  item.perfume.id,
                                  item.quantity + 1
                                )
                              }
                              className="grid h-8 w-8 place-items-center text-white/70 hover:text-white"
                              aria-label="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-black text-white">
                            {formatBRL(item.perfume.salePrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Total
                </span>
                <span className="text-2xl font-black text-white">
                  {formatBRL(bagTotal)}
                </span>
              </div>
              <a
                href={bag.length > 0 ? whatsappUrl(bagMessage) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-whatsapp flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base ${
                  bag.length === 0 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488" />
                </svg>
                Finalizar no WhatsApp
              </a>
            </div>
          </aside>
        </div>
      )}

      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p className="font-bold uppercase tracking-[0.18em]">
            Imperial Parfum &copy; {new Date().getFullYear()}
          </p>
          <Link
            href="/admin"
            className="font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-gold-500"
          >
            Acesso administrativo
          </Link>
        </div>
      </footer>

      <PerfumeModal
        perfume={selected}
        onClose={() => setSelected(null)}
        onAddToBag={addToBag}
        buyHref={selected ? whatsappUrl(singleProductMessage(selected)) : undefined}
      />
    </main>
  );
}
