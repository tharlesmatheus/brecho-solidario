"use client";

import { createContext, useContext } from "react";
import type { Perfil } from "@/lib/tipos";

export interface Equipe {
  perfil: Perfil;
  membros: Perfil[];
  recarregarMembros: () => Promise<void>;
}

export const PerfilCtx = createContext<Equipe | null>(null);

/** Perfil do usuário logado + lista da equipe (para responsáveis de tarefas, nomes no feed etc.). */
export function useEquipe(): Equipe {
  const ctx = useContext(PerfilCtx);
  if (!ctx) throw new Error("useEquipe fora do painel");
  return ctx;
}

export function nomeDe(membros: Perfil[], id: string | null | undefined, padrao = "Alguém"): string {
  if (!id) return padrao;
  return membros.find((m) => m.id === id)?.nome || padrao;
}
