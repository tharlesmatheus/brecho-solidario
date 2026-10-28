"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import Titulo from "@/components/Titulo";
import { useAviso } from "@/components/Providers";
import { useEquipe, nomeDe } from "@/components/PerfilContext";
import { sb, mensagemErro } from "@/lib/supabase";
import { data as fmtData } from "@/lib/tipos";

type StatusTarefa = "a_fazer" | "fazendo" | "feito";
interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  responsavel_id: string | null;
  data_prevista: string | null;
  criado_por: string | null;
}

const COLUNAS: { id: StatusTarefa; rotulo: string }[] = [
  { id: "a_fazer", rotulo: "A fazer" },
  { id: "fazendo", rotulo: "Fazendo" },
  { id: "feito", rotulo: "Feito" },
];
const ORDEM: StatusTarefa[] = ["a_fazer", "fazendo", "feito"];

/** Modelos para criar tarefas comuns com um clique (reconhecer em vez de lembrar). */
const MODELOS = ["Triagem das doações", "Fotografar peças", "Precificar peças", "Plantão no caixa", "Organizar araras", "Divulgar novidades"];

export default function Tarefas() {
  const aviso = useAviso();
  const { perfil, membros } = useEquipe();
  const [lista, setLista] = useState<Tarefa[]>([]);
  const [filtro, setFiltro] = useState<"todas" | "minhas">("todas");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", responsavel_id: "", data_prevista: "" });
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    const { data } = await sb().from("tarefas").select("*").order("data_prevista", { nullsFirst: false }).order("criado_em");
    setLista((data as Tarefa[]) ?? []);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return setErro("Dê um título para a tarefa.");
    const { error } = await sb().from("tarefas").insert({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      responsavel_id: form.responsavel_id || null,
      data_prevista: form.data_prevista || null,
    });
    if (error) return setErro(mensagemErro(error));
    setAberto(false);
    setForm({ titulo: "", descricao: "", responsavel_id: "", data_prevista: "" });
    aviso("Tarefa criada.");
    carregar();
  }

  async function mover(t: Tarefa, direcao: 1 | -1) {
    const novo = ORDEM[ORDEM.indexOf(t.status) + direcao];
    if (!novo) return;
    // Quem pega uma tarefa sem dono vira o responsável (coordenação).
    const extra = novo === "fazendo" && !t.responsavel_id ? { responsavel_id: perfil.id } : {};
    setLista((l) => l.map((x) => (x.id === t.id ? { ...x, status: novo, ...extra } : x)));
    const { error } = await sb().from("tarefas").update({ status: novo, ...extra }).eq("id", t.id);
    if (error) {
      aviso(mensagemErro(error), "error");
      carregar();
    }
  }

  async function apagar(t: Tarefa) {
    const { error } = await sb().from("tarefas").delete().eq("id", t.id);
    if (error) return aviso(mensagemErro(error), "error");
    carregar();
  }

  const visiveis = filtro === "minhas" ? lista.filter((t) => t.responsavel_id === perfil.id) : lista;

  return (
    <>
      <Titulo
        titulo="Tarefas e escala"
        subtitulo="Quem faz o quê e quando. Use as setas para mover as tarefas."
        acoes={
          <>
            <TextField select size="small" value={filtro} onChange={(e) => setFiltro(e.target.value as "todas" | "minhas")} sx={{ width: 160 }} aria-label="Filtro">
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="minhas">Só as minhas</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setErro(""); setAberto(true); }}>Nova tarefa</Button>
          </>
        }
      />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
        {COLUNAS.map((c) => {
          const itens = visiveis.filter((t) => t.status === c.id);
          return (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5, bgcolor: "action.hover" }} component="section" aria-label={c.rotulo}>
              <Typography variant="subtitle1" component="h2" sx={{ mb: 1, px: 0.5 }}>
                {c.rotulo} <Chip size="small" label={itens.length} />
              </Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {itens.map((t) => {
                  const atrasada = t.data_prevista && t.status !== "feito" && new Date(t.data_prevista + "T23:59:59") < new Date();
                  return (
                    <Paper key={t.id} sx={{ p: 1.5 }}>
                      <Typography sx={{ textDecoration: t.status === "feito" ? "line-through" : "none" }}>{t.titulo}</Typography>
                      {t.descricao && <Typography variant="body2" color="text.secondary">{t.descricao}</Typography>}
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1, alignItems: "center" }}>
                        <Chip size="small" label={t.responsavel_id ? nomeDe(membros, t.responsavel_id) : "Sem responsável"} variant="outlined" />
                        {t.data_prevista && (
                          <Chip size="small" color={atrasada ? "error" : "default"} label={`${atrasada ? "Atrasada · " : ""}${fmtData(t.data_prevista + "T12:00:00")}`} />
                        )}
                        <Box sx={{ ml: "auto" }}>
                          {t.status !== "a_fazer" && (
                            <IconButton size="small" aria-label={`Voltar "${t.titulo}"`} onClick={() => mover(t, -1)}><ArrowBackIcon fontSize="small" /></IconButton>
                          )}
                          {t.status !== "feito" && (
                            <IconButton size="small" color="primary" aria-label={`Avançar "${t.titulo}"`} onClick={() => mover(t, 1)}><ArrowForwardIcon fontSize="small" /></IconButton>
                          )}
                          {(perfil.papel === "admin" || t.criado_por === perfil.id) && (
                            <IconButton size="small" aria-label={`Apagar "${t.titulo}"`} onClick={() => apagar(t)}><DeleteIcon fontSize="small" /></IconButton>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Dialog open={aberto} onClose={() => setAberto(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={criar}>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {MODELOS.map((m) => <Chip key={m} label={m} onClick={() => setForm({ ...form, titulo: m })} variant={form.titulo === m ? "filled" : "outlined"} />)}
            </Box>
            <TextField label="Título" required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <TextField label="Detalhes (opcional)" multiline minRows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <TextField select label="Responsável" value={form.responsavel_id} onChange={(e) => setForm({ ...form, responsavel_id: e.target.value })}>
              <MenuItem value="">Qualquer pessoa</MenuItem>
              {membros.filter((m) => m.papel !== "pendente").map((m) => <MenuItem key={m.id} value={m.id}>{m.nome}</MenuItem>)}
            </TextField>
            <TextField label="Para quando" type="date" value={form.data_prevista} onChange={(e) => setForm({ ...form, data_prevista: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            {erro && <Alert severity="error">{erro}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAberto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Criar</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
