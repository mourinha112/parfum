"use client";

import { useEffect } from "react";
import { formatBRL, type Perfume } from "@/lib/types";
import { whatsappUrl, STORE_NAME } from "@/lib/config";

export default function PerfumeModal({
  perfume,
  onClose,
}: {
  perfume: Perfume | null;
  onClose: () => void;
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
  const message = `Olá, ${STORE_NAME}! Tenho interesse no perfume *${perfume.name}* (${perfume.brand}) — ${formatBRL(perfume.salePrice)}. Ainda está disponível?`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="perfume-modal-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto card rounded-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 border border-gold-500/30 text-gold-500 hover:bg-gold-500/10 hover:border-gold-500 transition-colors flex items-center justify-center"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative aspect-square md:aspect-auto bg-black flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent pointer-events-none" />
            {perfume.imageUrl ? (
              <img
                src={perfume.imageUrl}
                alt={perfume.name}
                className="absolute inset-0 h-full w-full object-contain p-6 md:p-10"
              />
            ) : (
              <div className="relative z-10 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-600">
                Foto pendente
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold-500 bg-gold-500/10 border border-gold-500/30 rounded-full px-3 py-1">
                {perfume.brand}
              </span>
              {perfume.featured && (
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30">
                  Destaque
                </span>
              )}
              {soldOut && (
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-red-900/40 text-red-200 border border-red-500/40">
                  Esgotado
                </span>
              )}
            </div>

            <h2
              id="perfume-modal-title"
              className="text-3xl md:text-4xl font-serif text-white leading-tight"
            >
              {perfume.name}
            </h2>

            <div className="divider max-w-[140px] text-[9px] tracking-[0.3em] uppercase">
              {perfume.volumeMl}ml
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">
              {perfume.description}
            </p>

            <div className="mt-auto pt-4 border-t border-gold-500/10 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                  Por apenas
                </p>
                <p className="text-4xl md:text-5xl font-serif gold-gradient font-semibold">
                  {formatBRL(perfume.salePrice)}
                </p>
              </div>

              <a
                href={whatsappUrl(message)}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-whatsapp w-full py-4 rounded-xl flex items-center justify-center gap-3 text-base ${
                  soldOut ? "opacity-60 pointer-events-none" : ""
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

              {!soldOut && perfume.stock <= 3 && (
                <p className="text-center text-xs text-amber-400">
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
