import { SEED_PERFUMES } from "./seed";
import {
  PERFUME_IMAGE_BUCKET,
  getSupabaseProjectHost,
  getSupabaseClient,
  requireSupabaseClient,
} from "./supabase";
import {
  normalizePerfume,
  roundMoney,
  type Perfume,
} from "./types";
import { slugify } from "./storage";

type PerfumeRow = {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  image_url: string | null;
  stock: number | string | null;
  cost_price: number | string | null;
  sale_price: number | string | null;
  markup_percent: number | string | null;
  volume_ml: number | string | null;
  featured: boolean | null;
};

type AdminStatus = {
  authed: boolean;
  email: string;
  userId: string;
  adminCheckError?: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateImageFile(file: File): void {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("A foto precisa ter no maximo 5 MB.");
  }

  if (file.type && !SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Use uma imagem JPG, PNG, WEBP, GIF ou AVIF.");
  }
}

function uploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("bucket not found")) {
    return "Bucket perfume-images nao encontrado. Rode o arquivo supabase/storage-setup.sql no SQL Editor do Supabase.";
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("violates row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("not authorized")
  ) {
    return "Sem permissao para enviar foto no Storage. Rode o arquivo supabase/storage-setup.sql e confirme que o usuario esta em public.admin_users.";
  }

  if (lower.includes("mime") || lower.includes("type")) {
    return "Tipo de imagem nao aceito. Use JPG, PNG, WEBP, GIF ou AVIF.";
  }

  return `Falha no upload da foto: ${message}`;
}

function rowToPerfume(row: PerfumeRow): Perfume {
  return normalizePerfume({
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    stock: toNumber(row.stock),
    costPrice: toNumber(row.cost_price),
    salePrice: toNumber(row.sale_price),
    markupPercent: toNumber(row.markup_percent),
    volumeMl: toNumber(row.volume_ml) || 100,
    featured: !!row.featured,
  });
}

function perfumeToRow(perfume: Perfume): PerfumeRow {
  return {
    id: perfume.id,
    name: perfume.name.trim(),
    brand: perfume.brand.trim(),
    description: perfume.description.trim(),
    image_url: perfume.imageUrl.trim(),
    stock: Math.max(0, Math.round(Number(perfume.stock) || 0)),
    cost_price: roundMoney(Number(perfume.costPrice) || 0),
    sale_price: roundMoney(Number(perfume.salePrice) || 0),
    markup_percent: roundMoney(Number(perfume.markupPercent) || 0),
    volume_ml: Math.max(1, Math.round(Number(perfume.volumeMl) || 100)),
    featured: !!perfume.featured,
  };
}

export async function fetchSupabasePerfumes(): Promise<Perfume[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return SEED_PERFUMES;

  const { data, error } = await supabase
    .from("perfumes")
    .select("*")
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToPerfume(row as PerfumeRow));
}

export async function upsertSupabasePerfume(perfume: Perfume): Promise<Perfume> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("perfumes")
    .upsert(perfumeToRow(perfume))
    .select("*")
    .single();

  if (error) throw error;
  return rowToPerfume(data as PerfumeRow);
}

export async function deleteSupabasePerfume(id: string): Promise<void> {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from("perfumes").delete().eq("id", id);
  if (error) throw error;
}

export async function replaceSupabasePerfumes(): Promise<Perfume[]> {
  const supabase = requireSupabaseClient();
  const rows = SEED_PERFUMES.map(perfumeToRow);
  const { error: deleteError } = await supabase
    .from("perfumes")
    .delete()
    .neq("id", "__never__");

  if (deleteError) throw deleteError;

  const { data, error } = await supabase
    .from("perfumes")
    .insert(rows)
    .select("*")
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToPerfume(row as PerfumeRow));
}

export async function getAdminStatus(): Promise<AdminStatus> {
  const supabase = getSupabaseClient();
  if (!supabase) return { authed: false, email: "", userId: "" };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { authed: false, email: "", userId: "" };
  }

  const email = userData.user.email ?? "";
  const userId = userData.user.id;

  const { data: rpcData, error: rpcError } = await supabase.rpc("is_admin");
  if (!rpcError) {
    return {
      authed: rpcData === true,
      email,
      userId,
    };
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    authed: !error && !!data,
    email,
    userId,
    adminCheckError: error?.message ?? rpcError.message,
  };
}

export async function signInSupabaseAdmin(
  email: string,
  password: string,
): Promise<AdminStatus> {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;

  const status = await getAdminStatus();
  if (!status.authed) {
    await supabase.auth.signOut();
    const adminEmail = email.trim();
    throw new Error(
      `Login correto, mas ${adminEmail} ainda nao esta liberado como admin neste projeto (${getSupabaseProjectHost()}). User ID logado: ${status.userId}. Confirme se este ID esta em public.admin_users. ${status.adminCheckError ?? ""}`,
    );
  }

  return status;
}

export async function signOutSupabaseAdmin(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function uploadPerfumeImage(file: File): Promise<string> {
  const supabase = requireSupabaseClient();
  validateImageFile(file);

  const status = await getAdminStatus();
  if (!status.authed) {
    throw new Error(
      `Este usuario nao esta liberado para upload no Storage. User ID: ${status.userId || "nao encontrado"}.`,
    );
  }

  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
  const name = slugify(file.name.replace(/\.[^.]+$/, "")) || "perfume";
  const path = `perfumes/${Date.now()}-${name}.${extension.toLowerCase()}`;

  const { error } = await supabase.storage
    .from(PERFUME_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) throw new Error(uploadErrorMessage(error));

  const { data } = supabase.storage
    .from(PERFUME_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
