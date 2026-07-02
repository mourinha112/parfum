"use client";

import { useEffect } from "react";
import { formatBRL, type Perfume } from "@/lib/types";
import { whatsappUrl, STORE_NAME } from "@/lib/config";

export default function PerfumeModal({
  perfume,
  onClose,
  onAddToBag,
  buyHref,
}: {
  perfume: Perfume | null;
  onClose: () => void;
  onAddToBag?: (p: Perfume) => void;
  buyHref?: string;
}) {
  useEffect(() => {
    if (!perfume) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [perfume, onClose]);

  if (!perfume) return null;

  const soldOut = perfume.stock <= 0;
  const fallbackMessage = `Ola, ${STORE_NAME}! Vim pelo site e escolhi o perfume ${perfume.name} (${perfume.brand}), valor ${formatBRL(perfume.salePrice)}. Quero saber se ainda esta disponivel.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="perfume-modal-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#101010] shadow-2xl shadow-black animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/70 text-white/70 transition hover:border-gold-500 hover:text-gold-500"
        >
          <svg
            width="16"
            height="16"
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

        <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[360px] bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14),transparent_55%)]" />
            {perfume.imageUrl ? (
              <img
                src={perfume.imageUrl}
                alt={perfume.name}
                className="absolute inset-0 h-full w-full object-contain p-8 md:p-12"
              />
            ) : (
              <div className="relative z-10 grid h-full place-items-center text-center text-[10px] uppercase tracking-[0.22em] text-neutral-600">
                Foto pendente
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold-300">
                {perfume.brand}
              </span>
              {perfume.featured && (
                <span className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">
                  Destaque
                </span>
              )}
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                  soldOut
                    ? "border-red-400/40 bg-red-950/60 text-red-100"
                    : "border-emerald-400/30 bg-emerald-950/40 text-emerald-200"
                }`}
              >
                {soldOut ? "Esgotado" : "Disponivel"}
              </span>
            </div>

            <div>
              <h2
                id="perfume-modal-title"
                className="text-3xl font-black leading-tight text-white md:text-5xl"
              >
                {perfume.name}
              </h2>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
                {perfume.volumeMl}ml
              </p>
            </div>

            <p className="text-sm leading-7 text-neutral-300">
              {perfume.description}
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Marca
                </p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {perfume.brand}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Volume
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {perfume.volumeMl}ml
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Estoque
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {perfume.stock}
                </p>
              </div>
            </div>

            <div className="mt-auto border-t border-white/10 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                Valor
              </p>
              <p className="mt-1 text-4xl font-black text-white md:text-5xl">
                {formatBRL(perfume.salePrice)}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
                <a
                  href={
                    soldOut ? undefined : buyHref ?? whatsappUrl(fallbackMessage)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn-whatsapp flex min-h-12 items-center justify-center gap-3 rounded-xl px-5 text-base ${
                    soldOut ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488" />
                  </svg>
                  {soldOut ? "Produto esgotado" : "Comprar pelo WhatsApp"}
                </a>

                <button
                  type="button"
                  onClick={() => onAddToBag?.(perfume)}
                  disabled={soldOut}
                  className="min-h-12 rounded-xl border border-gold-500/40 px-5 text-sm font-black uppercase tracking-[0.12em] text-gold-300 transition hover:border-gold-500 hover:bg-gold-500 hover:text-black disabled:pointer-events-none disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>

              {!soldOut && perfume.stock <= 3 && (
                <p className="mt-3 text-center text-xs font-bold text-amber-300">
                  Restam apenas {perfume.stock} unidade
                  {perfume.stock > 1 ? "s" : ""} em estoque
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
