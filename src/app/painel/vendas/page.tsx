"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import Titulo from "@/components/Titulo";
import { useAviso } from "@/components/Providers";
import { useEquipe, nomeDe } from "@/components/PerfilContext";
import { sb, mensagemErro } from "@/lib/supabase";
import { brl, dataHora, FORMAS_PAGAMENTO, type Peca } from "@/lib/tipos";

interface Venda {
  id: string;
  total: number;
  desconto: number;
  forma_pagamento: string;
  cliente_nome: string | null;
  vendedor_id: string | null;
  cancelada: boolean;
  criado_em: string;
  venda_itens: { pecas: { codigo: string; titulo: string } | null }[];
}

/** Aceita "P00012", "p12" ou só "12". */
function normalizarCodigo(txt: string): string {
  const s = txt.trim().toUpperCase();
  const num = s.replace(/^P/, "");
  if (/^\d+$/.test(num)) return "P" + num.padStart(5, "0");
  return s;
}

export default function Vendas() {
  const aviso = useAviso();
  const { perfil, membros } = useEquipe();
  const campo = useRef<HTMLInputElement>(null);
  const [codigo, setCodigo] = useState("");
  const [carrinho, setCarrinho] = useState<Peca[]>([]);
  const [desconto, setDesconto] = useState("");
  const [forma, setForma] = useState<string>("Pix");
  const [cliente, setCliente] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [cancelar, setCancelar] = useState<Venda | null>(null);

  const carregarVendas = useCallback(async () => {
    const { data } = await sb()
      .from("vendas")
      .select("*, venda_itens(pecas(codigo,titulo))")
      .order("criado_em", { ascending: false })
      .limit(30);
    setVendas((data as unknown as Venda[]) ?? []);
  }, []);

  useEffect(() => {
    carregarVendas();
  }, [carregarVendas]);

  const subtotal = carrinho.reduce((s, p) => s + Number(p.preco), 0);
  const valorDesconto = Math.max(0, Number(desconto.replace(",", ".")) || 0);
  const total = Math.max(0, subtotal - valorDesconto);

  const caixaHoje = useMemo(() => {
    const hoje = new Date().toDateString();
    const r: Record<string, number> = {};
    vendas
      .filter((v) => !v.cancelada && new Date(v.criado_em).toDateString() === hoje)
      .forEach((v) => (r[v.forma_pagamento] = (r[v.forma_pagamento] ?? 0) + Number(v.total)));
    return r;
  }, [vendas]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const cod = normalizarCodigo(codigo);
    if (!cod) return;
    if (carrinho.some((p) => p.codigo === cod)) {
      aviso(`${cod} já está no carrinho.`, "info");
      setCodigo("");
      return;
    }
    setBuscando(true);
    const { data, error } = await sb().from("pecas").select("*").eq("codigo", cod).maybeSingle();
    setBuscando(false);
    if (error) return aviso(mensagemErro(error), "error");
    const p = data as Peca | null;
    if (!p) return aviso(`Não encontrei a peça ${cod}. Confira o código na etiqueta.`, "warning");
    if (p.status === "vendida") return aviso(`${cod} já foi vendida.`, "warning");
    if (p.status === "triagem") return aviso(`${cod} ainda está em triagem. Defina o preço no Estoque.`, "warning");
    if (p.status === "repassada") return aviso(`${cod} foi marcada como repassada.`, "warning");
    if (p.status === "reservada") aviso(`${cod} estava reservada — a reserva será concluída com esta venda.`, "info");
    setCarrinho((c) => [...c, p]);
    setCodigo("");
    campo.current?.focus();
  }

  async function finalizar() {
    if (valorDesconto > subtotal) return aviso("O desconto é maior que o total.", "error");
    setFinalizando(true);
    const { error } = await sb().rpc("registrar_venda", {
      p_pecas: carrinho.map((p) => p.id),
      p_desconto: valorDesconto,
      p_forma: forma,
      p_cliente: cliente || null,
    });
    setFinalizando(false);
    if (error) return aviso(mensagemErro(error), "error");
    aviso(`Venda de ${brl(total)} registrada!`);
    setCarrinho([]);
    setDesconto("");
    setCliente("");
    carregarVendas();
    campo.current?.focus();
  }

  async function confirmarCancelamento() {
    if (!cancelar) return;
    const { error } = await sb().rpc("cancelar_venda", { p_venda: cancelar.id });
    setCancelar(null);
    if (error) return aviso(mensagemErro(error), "error");
    aviso("Venda cancelada. As peças voltaram para a vitrine.");
    carregarVendas();
  }

  return (
    <>
      <Titulo titulo="Caixa / Vendas" subtitulo="Digite o código da etiqueta e aperte Enter" />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" }, alignItems: "start" }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box component="form" onSubmit={adicionar} sx={{ display: "flex", gap: 1 }}>
            <TextField
              inputRef={campo}
              autoFocus
              label="Código da peça"
              placeholder="Ex.: P00012 ou 12"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit" variant="contained" disabled={buscando || !codigo.trim()} startIcon={<AddShoppingCartIcon />} sx={{ flexShrink: 0 }}>
              Adicionar
            </Button>
          </Box>

          <List aria-label="Carrinho" sx={{ my: 1 }}>
            {carrinho.length === 0 && (
              <ListItem><ListItemText secondary="Carrinho vazio." /></ListItem>
            )}
            {carrinho.map((p) => (
              <ListItem
                key={p.id}
                divider
                secondaryAction={
                  <IconButton edge="end" aria-label={`Tirar ${p.codigo} do carrinho`} onClick={() => setCarrinho((c) => c.filter((x) => x.id !== p.id))}>
                    <CloseIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={`${p.codigo} · ${p.titulo}`} secondary={`Tam. ${p.tamanho} · ${brl(p.preco)}`} />
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
            <TextField
              label="Desconto"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              inputMode="decimal"
              slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
            />
            <TextField label="Cliente (opcional)" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </Box>
          <ToggleButtonGroup
            exclusive
            fullWidth
            color="primary"
            value={forma}
            onChange={(_, v) => v && setForma(v)}
            aria-label="Forma de pagamento"
            sx={{ my: 2 }}
          >
            {FORMAS_PAGAMENTO.map((f) => <ToggleButton key={f} value={f}>{f}</ToggleButton>)}
          </ToggleButtonGroup>

          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {carrinho.length} peça(s) · subtotal {brl(subtotal)}{valorDesconto > 0 && ` · desconto ${brl(valorDesconto)}`}
              </Typography>
              <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>{brl(total)}</Typography>
            </Box>
            <Button variant="contained" size="large" disabled={!carrinho.length || finalizando} onClick={finalizar}>
              {finalizando ? "Registrando…" : "Finalizar venda"}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>Caixa de hoje</Typography>
            {Object.keys(caixaHoje).length === 0 && <Typography variant="body2" color="text.secondary">Nenhuma venda hoje.</Typography>}
            {Object.entries(caixaHoje).map(([f, v]) => (
              <Box key={f} sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>{f}</Typography><Typography>{brl(v)}</Typography>
              </Box>
            ))}
            {Object.keys(caixaHoje).length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography fontWeight={700}>Total</Typography>
                  <Typography fontWeight={700}>{brl(Object.values(caixaHoje).reduce((a, b) => a + b, 0))}</Typography>
                </Box>
              </>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>Últimas vendas</Typography>
            <List dense>
              {vendas.map((v) => (
                <ListItem
                  key={v.id}
                  divider
                  sx={{ opacity: v.cancelada ? 0.55 : 1 }}
                  secondaryAction={
                    perfil.papel === "admin" && !v.cancelada ? (
                      <Button size="small" color="error" onClick={() => setCancelar(v)}>Cancelar</Button>
                    ) : v.cancelada ? <Chip size="small" label="Cancelada" /> : null
                  }
                >
                  <ListItemText
                    primary={`${brl(v.total)} · ${v.forma_pagamento}`}
                    secondary={`${dataHora(v.criado_em)} · ${v.venda_itens.map((i) => i.pecas?.codigo).join(", ")} · por ${nomeDe(membros, v.vendedor_id)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>

      <Dialog open={!!cancelar} onClose={() => setCancelar(null)}>
        <DialogTitle>Cancelar esta venda?</DialogTitle>
        <DialogContent>
          A venda de {cancelar && brl(cancelar.total)} será cancelada e as peças voltam para a vitrine. Devolva o
          valor ao cliente, se for o caso.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelar(null)}>Voltar</Button>
          <Button color="error" variant="contained" onClick={confirmarCancelamento}>Cancelar venda</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
