"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import Titulo from "@/components/Titulo";
import { FotoPeca } from "@/components/CartaoPeca";
import { useAviso } from "@/components/Providers";
import { sb, mensagemErro } from "@/lib/supabase";
import { brl, tempoRelativo } from "@/lib/tipos";

interface Reserva {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  status: "pendente" | "concluida" | "cancelada";
  criado_em: string;
  pecas: { codigo: string; titulo: string; preco: number; foto_url: string | null } | null;
}

const DIAS_LIMITE = 3;

export default function Reservas() {
  const aviso = useAviso();
  const [aba, setAba] = useState<"pendente" | "historico">("pendente");
  const [lista, setLista] = useState<Reserva[] | null>(null);

  const carregar = useCallback(async () => {
    let q = sb().from("reservas").select("*, pecas(codigo,titulo,preco,foto_url)").order("criado_em", { ascending: aba === "pendente" }).limit(100);
    q = aba === "pendente" ? q.eq("status", "pendente") : q.neq("status", "pendente");
    const { data, error } = await q;
    if (error) aviso(mensagemErro(error), "error");
    setLista((data as unknown as Reserva[]) ?? []);
  }, [aba, aviso]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function cancelar(r: Reserva) {
    const { error } = await sb().rpc("cancelar_reserva", { p_reserva: r.id });
    if (error) return aviso(mensagemErro(error), "error");
    aviso("Reserva cancelada. A peça voltou para a vitrine.");
    carregar();
  }

  function whats(r: Reserva) {
    let tel = r.cliente_telefone.replace(/\D/g, "");
    if (tel.length <= 11) tel = "55" + tel;
    const txt = `Olá, ${r.cliente_nome}! Sua reserva da peça ${r.pecas?.codigo} (${r.pecas?.titulo}) está separada no brechó.`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(txt)}`;
  }

  return (
    <>
      <Titulo titulo="Reservas" subtitulo="Feitas pela vitrine. Para concluir, registre a venda no Caixa com o código da peça." />
      <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ mb: 2 }}>
        <Tab value="pendente" label="Aguardando retirada" />
        <Tab value="historico" label="Histórico" />
      </Tabs>

      {lista && lista.length === 0 && <Alert severity="info">Nenhuma reserva aqui.</Alert>}
      <Box sx={{ display: "grid", gap: 1 }}>
        {lista?.map((r) => {
          const dias = (Date.now() - new Date(r.criado_em).getTime()) / 86400000;
          return (
            <Paper key={r.id} variant="outlined" sx={{ p: 1.5, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                <FotoPeca peca={{ foto_url: r.pecas?.foto_url ?? null, titulo: r.pecas?.titulo ?? "" }} altura={56} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 180 }}>
                <Typography><b>{r.pecas?.codigo}</b> · {r.pecas?.titulo} · {brl(r.pecas?.preco)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.cliente_nome} · {r.cliente_telefone} · {tempoRelativo(r.criado_em)}
                </Typography>
                {r.status === "pendente" && dias > DIAS_LIMITE && (
                  <Chip size="small" color="warning" label={`Há mais de ${DIAS_LIMITE} dias`} sx={{ mt: 0.5 }} />
                )}
                {r.status !== "pendente" && (
                  <Chip size="small" label={r.status === "concluida" ? "Vendida" : "Cancelada"} sx={{ mt: 0.5 }} />
                )}
              </Box>
              {r.status === "pendente" && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="outlined" startIcon={<WhatsAppIcon />} href={whats(r)} target="_blank" rel="noopener noreferrer">
                    Avisar
                  </Button>
                  <Button color="error" onClick={() => cancelar(r)}>Cancelar</Button>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </>
  );
}
