"use client";

import { formatBRL, type Perfume } from "@/lib/types";

export default function PerfumeCard({
  perfume,
  onClick,
}: {
  perfume: Perfume;
  onClick?: (p: Perfume) => void;
}) {
  const soldOut = perfume.stock <= 0;
  return (
    <button
      type="button"
      onClick={() => onClick?.(perfume)}
      className="card rounded-2xl overflow-hidden group relative text-left w-full focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:ring-offset-2 focus:ring-offset-black"
    >
      {perfume.featured && (
        <span className="absolute top-3 right-3 z-10 text-[10px] tracking-widest uppercase px-2 py-1 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30">
          Destaque
        </span>
      )}
      {soldOut && (
        <span className="absolute top-3 left-3 z-10 text-[10px] tracking-widest uppercase px-2 py-1 rounded-full bg-red-900/40 text-red-200 border border-red-500/40">
          Esgotado
        </span>
      )}
      <div className="relative aspect-[4/5] bg-black flex items-center justify-center overflow-hidden">
        {perfume.imageUrl ? (
          <img
            src={perfume.imageUrl}
            alt={perfume.name}
            className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="px-5 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-600">
            Foto pendente
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-500 block text-center">
            Ver detalhes →
          </span>
        </div>
      </div>
      <div className="p-5 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold-500/80">
          {perfume.brand}
        </p>
        <h3 className="text-xl font-serif text-white leading-tight">
          {perfume.name}
        </h3>
        <p className="text-xs text-neutral-400 line-clamp-3 min-h-[3rem]">
          {perfume.description}
        </p>
        <div className="pt-3 flex items-end justify-between border-t border-gold-500/10">
          <span className="text-2xl font-serif gold-gradient font-semibold">
            {formatBRL(perfume.salePrice)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            {perfume.volumeMl}ml
          </span>
        </div>
      </div>
    </button>
  );
}
