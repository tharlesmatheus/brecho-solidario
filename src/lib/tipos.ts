export type Papel = "admin" | "voluntario" | "pendente";
export type StatusPeca = "triagem" | "disponivel" | "reservada" | "vendida" | "repassada";

export interface Perfil {
  id: string;
  nome: string;
  papel: Papel;
  criado_em: string;
}

export interface Peca {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  tamanho: string;
  genero: string;
  cor: string | null;
  estado: string;
  preco: number;
  status: StatusPeca;
  foto_url: string | null;
  doacao_id: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Doacao {
  id: string;
  doador_nome: string;
  doador_contato: string | null;
  quantidade: number;
  observacao: string | null;
  criado_em: string;
}

export const NOME_BRECHO = process.env.NEXT_PUBLIC_NOME_BRECHO || "Brechó Solidário";
export const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, "");

export const CATEGORIAS = [
  "Camisas e blusas",
  "Camisetas",
  "Calças",
  "Shorts e bermudas",
  "Saias",
  "Vestidos",
  "Casacos",
  "Infantil",
  "Calçados",
  "Acessórios",
  "Cama, mesa e banho",
  "Outros",
];
export const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG", "Infantil", "Único", "34", "36", "38", "40", "42", "44", "46", "48"];
export const GENEROS = ["Feminino", "Masculino", "Unissex", "Infantil"];
export const ESTADOS = ["Novo", "Ótimo", "Bom", "Regular"];
export const FORMAS_PAGAMENTO = ["Dinheiro", "Pix", "Cartão"] as const;

export const STATUS_PECA: Record<StatusPeca, { rotulo: string; cor: "default" | "info" | "success" | "warning" | "secondary" }> = {
  triagem: { rotulo: "Em triagem", cor: "default" },
  disponivel: { rotulo: "À venda", cor: "success" },
  reservada: { rotulo: "Reservada", cor: "warning" },
  vendida: { rotulo: "Vendida", cor: "info" },
  repassada: { rotulo: "Repassada/doada", cor: "secondary" },
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (v: number | string | null | undefined) => moeda.format(Number(v || 0));

export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
export const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/** "há 5 min", "há 2 h", "ontem"... — usado no feed de atividades (percepção). */
export function tempoRelativo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "ontem";
  return data(iso);
}

export function linkWhatsApp(texto: string): string | null {
  if (!WHATSAPP) return null;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}
