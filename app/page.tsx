"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import PerfumeCard from "@/components/PerfumeCard";
import PerfumeModal from "@/components/PerfumeModal";
import { fetchSupabasePerfumes } from "@/lib/supabase-perfumes";
import { isSupabaseConfigured } from "@/lib/supabase";
import { loadPerfumes } from "@/lib/storage";
import type { Perfume } from "@/lib/types";
import { SEED_PERFUMES } from "@/lib/seed";

export default function HomePage() {
  const [perfumes, setPerfumes] = useState<Perfume[]>(SEED_PERFUMES);
  const [selected, setSelected] = useState<Perfume | null>(null);

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

  return (
    <main className="min-h-screen">
      <header className="relative px-4 pt-14 pb-10 md:pt-20 md:pb-16">
        <Link
          href="/admin"
          className="absolute top-4 right-4 text-[11px] uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border border-gold-500/30 text-gold-500/80 hover:text-gold-500 hover:border-gold-500 transition-colors"
        >
          Admin
        </Link>
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          <Logo size="lg" />
          <p className="text-gold-500/90 text-xs md:text-sm tracking-[0.4em] uppercase">
            Fragrâncias Exclusivas
          </p>
          <div className="divider max-w-md w-full text-[10px] tracking-[0.35em] uppercase">
            Coleção Imperial
          </div>
          <p className="max-w-xl text-neutral-400 text-sm md:text-base leading-relaxed">
            Selecionamos perfumes árabes importados com presença marcante,
            fixação prolongada e essências que contam histórias. Bem-vindo à
            realeza dos aromas.
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-serif text-white">
            Nosso <span className="gold-gradient">catálogo</span>
          </h2>
          <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
            {perfumes.length} fragrâncias
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {perfumes.map((p) => (
            <PerfumeCard
              key={p.id}
              perfume={p}
              onClick={(perfume) => setSelected(perfume)}
            />
          ))}
        </div>

        {perfumes.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            Nenhum perfume cadastrado ainda.
          </div>
        )}
      </section>

      <footer className="border-t border-gold-500/10 py-8 px-4 text-center space-y-3">
        <p className="text-xs text-neutral-500 tracking-widest uppercase">
          Imperial Parfum © {new Date().getFullYear()}
        </p>
        <p className="text-[10px] text-neutral-600 tracking-wide">
          Fragrâncias árabes selecionadas · Entrega para todo o Brasil
        </p>
        <Link
          href="/admin"
          className="inline-block text-[10px] text-neutral-600 hover:text-gold-500 tracking-[0.3em] uppercase"
        >
          Acesso administrativo
        </Link>
      </footer>

      <PerfumeModal
        perfume={selected}
        onClose={() => setSelected(null)}
      />
    </main>
  );
}
