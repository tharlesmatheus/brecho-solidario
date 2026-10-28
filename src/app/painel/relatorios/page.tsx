"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import DownloadIcon from "@mui/icons-material/Download";
import Titulo from "@/components/Titulo";
import { sb } from "@/lib/supabase";
import { brl, data as fmtData, dataHora } from "@/lib/tipos";

interface VendaRel {
  id: string;
  total: number;
  forma_pagamento: string;
  cliente_nome: string | null;
  criado_em: string;
  venda_itens: { preco: number; pecas: { codigo: string; titulo: string; categoria: string } | null }[];
}
interface Parada { id: string; codigo: string; titulo: string; preco: number; criado_em: string }

const PERIODOS = { "7": "7 dias", "30": "30 dias", "90": "90 dias", "0": "Tudo" } as const;

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<keyof typeof PERIODOS>("30");
  const [vendas, setVendas] = useState<VendaRel[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [doadas, setDoadas] = useState(0);
  const [sus, setSus] = useState<{ media: number; n: number }>({ media: 0, n: 0 });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const desde = periodo === "0" ? new Date(0) : new Date(Date.now() - Number(periodo) * 86400000);
    const limiteParada = new Date(Date.now() - 30 * 86400000).toISOString();
    const c = sb();
    const [v, p, d, a] = await Promise.all([
      c.from("vendas").select("id,total,forma_pagamento,cliente_nome,criado_em,venda_itens(preco,pecas(codigo,titulo,categoria))")
        .eq("cancelada", false).gte("criado_em", desde.toISOString()).order("criado_em", { ascending: false }).limit(5000),
      c.from("pecas").select("id,codigo,titulo,preco,criado_em").eq("status", "disponivel").lt("criado_em", limiteParada).order("criado_em").limit(20),
      c.from("doacoes").select("quantidade").gte("criado_em", desde.toISOString()),
      c.from("avaliacoes").select("pontuacao"),
    ]);
    setVendas((v.data as unknown as VendaRel[]) ?? []);
    setParadas((p.data as Parada[]) ?? []);
    setDoadas(((d.data as { quantidade: number }[]) ?? []).reduce((s, x) => s + x.quantidade, 0));
    const notas = ((a.data as { pontuacao: number }[]) ?? []).map((x) => Number(x.pontuacao));
    setSus({ media: notas.length ? notas.reduce((s, x) => s + x, 0) / notas.length : 0, n: notas.length });
    setCarregando(false);
  }, [periodo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const total = vendas.reduce((s, v) => s + Number(v.total), 0);
  const pecasVendidas = vendas.reduce((s, v) => s + v.venda_itens.length, 0);
  const porForma: Record<string, number> = {};
  const porCategoria: Record<string, number> = {};
  vendas.forEach((v) => {
    porForma[v.forma_pagamento] = (porForma[v.forma_pagamento] ?? 0) + Number(v.total);
    v.venda_itens.forEach((i) => {
      const cat = i.pecas?.categoria ?? "Outros";
      porCategoria[cat] = (porCategoria[cat] ?? 0) + 1;
    });
  });
  const maxCat = Math.max(1, ...Object.values(porCategoria));

  function exportarCSV() {
    const linhas = [["Data", "Peças", "Forma", "Cliente", "Total"]];
    vendas.forEach((v) =>
      linhas.push([
        dataHora(v.criado_em),
        v.venda_itens.map((i) => i.pecas?.codigo).join(" "),
        v.forma_pagamento,
        v.cliente_nome ?? "",
        String(v.total).replace(".", ","),
      ])
    );
    const csv = linhas.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const indicadores = [
    { rotulo: "Total vendido", valor: brl(total) },
    { rotulo: "Vendas", valor: vendas.length },
    { rotulo: "Ticket médio", valor: brl(vendas.length ? total / vendas.length : 0) },
    { rotulo: "Peças reaproveitadas", valor: pecasVendidas },
    { rotulo: "Peças doadas", valor: doadas },
    { rotulo: "Usabilidade (SUS)", valor: sus.n ? `${sus.media.toFixed(1)} / 100` : "—", detalhe: `${sus.n} avaliação(ões)` },
  ];

  return (
    <>
      <Titulo
        titulo="Relatórios"
        subtitulo="Resultados do brechó no período"
        acoes={
          <>
            <ToggleButtonGroup exclusive size="small" value={periodo} onChange={(_, v) => v && setPeriodo(v)} aria-label="Período">
              {Object.entries(PERIODOS).map(([k, r]) => <ToggleButton key={k} value={k}>{r}</ToggleButton>)}
            </ToggleButtonGroup>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportarCSV} disabled={!vendas.length}>Exportar vendas</Button>
          </>
        }
      />
      {carregando && <LinearProgress sx={{ mb: 2 }} />}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, mb: 3 }}>
        {indicadores.map((i) => (
          <Paper key={i.rotulo} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">{i.rotulo}</Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>{i.valor}</Typography>
            {i.detalhe && <Typography variant="caption" color="text.secondary">{i.detalhe}</Typography>}
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>Peças vendidas por categoria</Typography>
          {Object.keys(porCategoria).length === 0 && <Typography color="text.secondary">Sem vendas no período.</Typography>}
          {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
            <Box key={cat} sx={{ mb: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">{cat}</Typography>
                <Typography variant="body2" fontWeight={700}>{n}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={(n / maxCat) * 100} sx={{ height: 8, borderRadius: 4 }} aria-label={`${cat}: ${n} peças`} />
            </Box>
          ))}
          <Typography variant="h6" component="h2" sx={{ mt: 3 }} gutterBottom>Por forma de pagamento</Typography>
          {Object.entries(porForma).map(([f, v]) => (
            <Box key={f} sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>{f}</Typography><Typography>{brl(v)}</Typography>
            </Box>
          ))}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2">Peças paradas</Typography>
          <Typography variant="body2" color="text.secondary">À venda há mais de 30 dias — que tal uma promoção?</Typography>
          <List dense>
            {paradas.length === 0 && <ListItem><ListItemText primary="Nenhuma peça parada. Ótimo giro!" /></ListItem>}
            {paradas.map((p) => (
              <ListItem key={p.id} divider>
                <ListItemText primary={`${p.codigo} · ${p.titulo}`} secondary={`${brl(p.preco)} · desde ${fmtData(p.criado_em)}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </>
  );
}
