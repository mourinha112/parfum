"use client";

import { normalizePerfume, type Perfume } from "./types";
import { SEED_PERFUMES } from "./seed";

const KEY = "imperial-parfum:perfumes:v1";
const AUTH_KEY = "imperial-parfum:admin";
// Protótipo: senha simples no client. Trocar por Supabase/Auth real antes de produção.
export const ADMIN_PASSWORD = "imperial2026";

export function loadPerfumes(): Perfume[] {
  if (typeof window === "undefined") return SEED_PERFUMES;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED_PERFUMES));
      return SEED_PERFUMES;
    }
    const parsed = JSON.parse(raw) as Partial<Perfume>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_PERFUMES;
    return parsed.map(normalizePerfume);
  } catch {
    return SEED_PERFUMES;
  }
}

export function savePerfumes(list: Perfume[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function resetPerfumes(): Perfume[] {
  if (typeof window === "undefined") return SEED_PERFUMES;
  window.localStorage.setItem(KEY, JSON.stringify(SEED_PERFUMES));
  return SEED_PERFUMES;
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(AUTH_KEY) === "1";
}

export function signIn(password: string): boolean {
  if (password !== ADMIN_PASSWORD) return false;
  window.sessionStorage.setItem(AUTH_KEY, "1");
  return true;
}

export function signOut(): void {
  window.sessionStorage.removeItem(AUTH_KEY);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
