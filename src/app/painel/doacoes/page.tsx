"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import Titulo from "@/components/Titulo";
import PecaDialog from "@/components/PecaDialog";
import { useAviso } from "@/components/Providers";
import { sb, mensagemErro } from "@/lib/supabase";
import { data, type Doacao } from "@/lib/tipos";

type DoacaoComPecas = Doacao & { pecas: { count: number }[] };

export default function DoacoesPage() {
  return (
    <Suspense>
      <Doacoes />
    </Suspense>
  );
}

function Doacoes() {
  const params = useSearchParams();
  const aviso = useAviso();
  const [lista, setLista] = useState<DoacaoComPecas[] | null>(null);
  const [aberto, setAberto] = useState(params.get("nova") === "1");
  const [form, setForm] = useState({ doador_nome: "", doador_contato: "", quantidade: "1", observacao: "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [loteParaPecas, setLoteParaPecas] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data: d, error } = await sb()
      .from("doacoes")
      .select("*, pecas(count)")
      .order("criado_em", { ascending: false })
      .limit(200);
    if (error) aviso(mensagemErro(error), "error");
    setLista((d as unknown as DoacaoComPecas[]) ?? []);
  }, [aviso]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const qtd = parseInt(form.quantidade, 10);
    if (!qtd || qtd < 1) return setErro("Informe quantas peças vieram (mínimo 1).");
    setSalvando(true);
    const { data: nova, error } = await sb()
      .from("doacoes")
      .insert({
        doador_nome: form.doador_nome.trim() || "Anônimo",
        doador_contato: form.doador_contato.trim() || null,
        quantidade: qtd,
        observacao: form.observacao.trim() || null,
      })
      .select()
      .single();
    setSalvando(false);
    if (error) return setErro(mensagemErro(error));
    setAberto(false);
    setForm({ doador_nome: "", doador_contato: "", quantidade: "1", observacao: "" });
    aviso("Doação registrada. Agora cadastre as peças deste lote.");
    carregar();
    setLoteParaPecas((nova as Doacao).id);
  }

  return (
    <>
      <Titulo
        titulo="Doações"
        subtitulo="Cada lote recebido e quantas peças dele já foram cadastradas"
        acoes={<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setErro(""); setAberto(true); }}>Registrar doação</Button>}
      />

      {lista && lista.length === 0 && <Alert severity="info">Nenhuma doação registrada ainda.</Alert>}
      <Box sx={{ display: "grid", gap: 1 }}>
        {lista?.map((d) => {
          const cadastradas = d.pecas?.[0]?.count ?? 0;
          const progresso = Math.min(100, (cadastradas / d.quantidade) * 100);
          return (
            <Paper key={d.id} variant="outlined" sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                <Typography><b>{d.doador_nome}</b> · {data(d.criado_em)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {cadastradas} de {d.quantidade} peça(s) cadastradas{d.observacao ? ` · ${d.observacao}` : ""}
                </Typography>
                <LinearProgress variant="determinate" value={progresso} sx={{ mt: 1, borderRadius: 4 }} aria-label="Progresso do cadastro do lote" />
              </Box>
              {cadastradas < d.quantidade && (
                <Button variant="outlined" onClick={() => setLoteParaPecas(d.id)}>Cadastrar peças</Button>
              )}
            </Paper>
          );
        })}
      </Box>

      <Dialog open={aberto} onClose={() => setAberto(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={salvar}>
          <DialogTitle>Registrar doação</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
            <TextField label="Quem doou" placeholder="Deixe vazio para anônimo" value={form.doador_nome} onChange={(e) => setForm({ ...form, doador_nome: e.target.value })} />
            <TextField label="Contato (opcional)" value={form.doador_contato} onChange={(e) => setForm({ ...form, doador_contato: e.target.value })} helperText="Só se o doador autorizar" />
            <TextField label="Quantidade de peças" type="number" required value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} slotProps={{ htmlInput: { min: 1 } }} />
            <TextField label="Observação" multiline minRows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Ex.: 2 sacolas, roupas infantis" />
            {erro && <Alert severity="error">{erro}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAberto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={salvando}>{salvando ? "Salvando…" : "Registrar"}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <PecaDialog
        aberto={!!loteParaPecas}
        peca={null}
        doacaoInicial={loteParaPecas ?? undefined}
        onFechar={() => setLoteParaPecas(null)}
        onSalvo={(p, continuar) => {
          aviso(`Peça ${p.codigo} cadastrada.`);
          carregar();
          if (!continuar) setLoteParaPecas(null);
        }}
      />
    </>
  );
}
