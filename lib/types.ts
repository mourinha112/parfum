export type Perfume = {
  id: string;
  name: string;
  brand: string;
  description: string;
  imageUrl: string;
  stock: number;
  costPrice: number;
  salePrice: number;
  markupPercent: number;
  volumeMl: number;
  featured?: boolean;
};

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function salePriceFromMarkup(cost: number, percent: number): number {
  if (cost <= 0) return 0;
  return roundMoney(cost * (1 + percent / 100));
}

export function profitMargin(cost: number, sale: number): number {
  if (sale <= 0) return 0;
  return ((sale - cost) / sale) * 100;
}

export function markup(cost: number, sale: number): number {
  if (cost <= 0) return 0;
  return ((sale - cost) / cost) * 100;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function normalizePerfume(value: Partial<Perfume>): Perfume {
  const costPrice = Number(value.costPrice ?? 0);
  const salePrice = Number(value.salePrice ?? 0);

  return {
    id: value.id ?? "",
    name: value.name ?? "",
    brand: value.brand ?? "",
    description: value.description ?? "",
    imageUrl: value.imageUrl ?? "",
    stock: Number(value.stock ?? 0),
    costPrice,
    salePrice,
    markupPercent: Number(value.markupPercent ?? markup(costPrice, salePrice)),
    volumeMl: Number(value.volumeMl ?? 100),
    featured: !!value.featured,
  };
}
