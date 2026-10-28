import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

/**
 * Cliente único do Supabase (criado só no navegador, na primeira chamada).
 * A segurança real fica no banco (Row Level Security) — a chave "anon" é pública por definição.
 */
export function sb(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (veja o README)."
    );
  }
  cliente = createClient(url, chave, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cliente;
}

/** Converte erros do Supabase/Postgres em uma mensagem legível para o usuário. */
export function mensagemErro(e: unknown): string {
  if (!e) return "Erro desconhecido.";
  const msg =
    typeof e === "object" && e !== null && "message" in e
      ? String((e as { message: unknown }).message)
      : String(e);
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Sem conexão com a internet. Tente de novo.";
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).";
  if (/User already registered/i.test(msg)) return "Este e-mail já tem cadastro. Use 'Entrar'.";
  if (/row-level security|permission denied/i.test(msg)) return "Você não tem permissão para fazer isso.";
  if (/duplicate key/i.test(msg)) return "Já existe um registro com esses dados.";
  return msg;
}
