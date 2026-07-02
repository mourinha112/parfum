"use client";

import { formatBRL, type Perfume } from "@/lib/types";

export default function PerfumeCard({
  perfume,
  onClick,
  onAddToBag,
  buyHref,
}: {
  perfume: Perfume;
  onClick?: (p: Perfume) => void;
  onAddToBag?: (p: Perfume) => void;
  buyHref?: string;
}) {
  const soldOut = perfume.stock <= 0;
  const lowStock = perfume.stock > 0 && perfume.stock <= 3;

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-gold-500/40">
      <button
        type="button"
        onClick={() => onClick?.(perfume)}
        className="relative aspect-[4/4.6] w-full overflow-hidden bg-black text-left focus:outline-none focus:ring-2 focus:ring-gold-500/50"
      >
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          {perfume.featured && (
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
              Destaque
            </span>
          )}
          {soldOut && (
            <span className="rounded-full border border-red-400/40 bg-red-950/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-100">
              Esgotado
            </span>
          )}
          {lowStock && (
            <span className="rounded-full border border-amber-300/40 bg-amber-950/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
              Ultimas
            </span>
          )}
        </div>

        {perfume.imageUrl ? (
          <img
            src={perfume.imageUrl}
            alt={perfume.name}
            className="h-full w-full object-contain p-7 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center px-5 text-center text-[10px] uppercase tracking-[0.22em] text-neutral-600">
            Foto pendente
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-4 opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            Ver detalhes
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-gold-500">
            {perfume.brand}
          </p>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            {perfume.volumeMl}ml
          </span>
        </div>

        <button
          type="button"
          onClick={() => onClick?.(perfume)}
          className="text-left focus:outline-none focus:text-gold-200"
        >
          <h3 className="text-xl font-black leading-tight text-white">
            {perfume.name}
          </h3>
        </button>

        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-neutral-400">
          {perfume.description}
        </p>

        <div className="mt-auto pt-4">
          <div className="mb-4 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                Preco
              </p>
              <p className="text-2xl font-black text-white">
                {formatBRL(perfume.salePrice)}
              </p>
            </div>
            <p
              className={`text-right text-[11px] font-bold uppercase tracking-[0.12em] ${
                soldOut ? "text-red-300" : "text-emerald-300"
              }`}
            >
              {soldOut ? "Indisponivel" : `${perfume.stock} em estoque`}
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <a
              href={soldOut ? undefined : buyHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-whatsapp inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm ${
                soldOut ? "pointer-events-none opacity-50" : ""
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              Comprar
            </a>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddToBag?.(perfume);
              }}
              disabled={soldOut}
              className="grid h-11 w-11 place-items-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-300 transition hover:border-gold-500 hover:bg-gold-500 hover:text-black disabled:pointer-events-none disabled:opacity-40"
              aria-label={`Adicionar ${perfume.name} a sacola`}
              title="Adicionar a sacola"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
