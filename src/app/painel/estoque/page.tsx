"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import QrCodeIcon from "@mui/icons-material/QrCode2";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import Titulo from "@/components/Titulo";
import PecaDialog from "@/components/PecaDialog";
import EtiquetaDialog from "@/components/EtiquetaDialog";
import { FotoPeca } from "@/components/CartaoPeca";
import { useAviso } from "@/components/Providers";
import { useEquipe } from "@/components/PerfilContext";
import { sb, mensagemErro } from "@/lib/supabase";
import { brl, CATEGORIAS, STATUS_PECA, tempoRelativo, type Peca, type StatusPeca } from "@/lib/tipos";

export default function EstoquePage() {
  return (
    <Suspense>
      <Estoque />
    </Suspense>
  );
}

function Estoque() {
  const params = useSearchParams();
  const router = useRouter();
  const aviso = useAviso();
  const { perfil } = useEquipe();
  const [pecas, setPecas] = useState<Peca[] | null>(null);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>(params.get("status") ?? "");
  const [categoria, setCategoria] = useState("");
  const [editando, setEditando] = useState<Peca | null>(null);
  const [dialogo, setDialogo] = useState(params.get("nova") === "1");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [etiquetas, setEtiquetas] = useState<Peca[]>([]);
  const [excluir, setExcluir] = useState<Peca | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await sb().from("pecas").select("*").order("criado_em", { ascending: false }).limit(2000);
    if (error) aviso(mensagemErro(error), "error");
    setPecas((data as Peca[]) ?? []);
  }, [aviso]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (pecas ?? []).filter(
      (p) =>
        (!status || p.status === status) &&
        (!categoria || p.categoria === categoria) &&
        (!t || `${p.codigo} ${p.titulo} ${p.cor ?? ""}`.toLowerCase().includes(t))
    );
  }, [pecas, busca, status, categoria]);

  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    (pecas ?? []).forEach((p) => (c[p.status] = (c[p.status] ?? 0) + 1));
    return c;
  }, [pecas]);

  function abrirNova() {
    setEditando(null);
    setDialogo(true);
  }

  function fecharDialogo() {
    setDialogo(false);
    if (params.get("nova")) router.replace("/painel/estoque");
  }

  async function colocarAVenda(p: Peca) {
    if (Number(p.preco) <= 0) {
      aviso("Defina o preço antes de colocar à venda.", "warning");
      setEditando(p);
      setDialogo(true);
      return;
    }
    const { error } = await sb().from("pecas").update({ status: "disponivel" }).eq("id", p.id);
    if (error) return aviso(mensagemErro(error), "error");
    aviso(`${p.codigo} está na vitrine.`);
    carregar();
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    const { error } = await sb().from("pecas").delete().eq("id", excluir.id);
    setExcluir(null);
    if (error) {
      aviso(/foreign key/i.test(error.message) ? "Esta peça já tem venda registrada; marque como repassada em vez de excluir." : mensagemErro(error), "error");
      return;
    }
    aviso("Peça excluída.");
    carregar();
  }

  function alternar(id: string) {
    const s = new Set(selecionadas);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelecionadas(s);
  }

  return (
    <>
      <Titulo
        titulo="Estoque"
        subtitulo="Todas as peças, da triagem à venda"
        acoes={
          <>
            {selecionadas.size > 0 && (
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
                onClick={() => setEtiquetas((pecas ?? []).filter((p) => selecionadas.has(p.id)))}
              >
                Etiquetas ({selecionadas.size})
              </Button>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNova}>
              Cadastrar peça
            </Button>
          </>
        }
      />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }} role="group" aria-label="Filtrar por situação">
        <Chip label={`Todas (${pecas?.length ?? 0})`} color={!status ? "primary" : "default"} onClick={() => setStatus("")} />
        {(Object.keys(STATUS_PECA) as StatusPeca[]).map((s) => (
          <Chip
            key={s}
            label={`${STATUS_PECA[s].rotulo} (${contagem[s] ?? 0})`}
            color={status === s ? "primary" : "default"}
            variant={status === s ? "filled" : "outlined"}
            onClick={() => setStatus(s)}
          />
        ))}
      </Box>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, mb: 2 }}>
        <TextField
          label="Buscar por código, nome ou cor"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
        />
        <TextField select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <MenuItem value="">Todas</MenuItem>
          {CATEGORIAS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>

      <Box sx={{ display: "grid", gap: 1 }}>
        {!pecas && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={88} />)}
        {pecas && filtradas.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography gutterBottom>Nenhuma peça aqui.</Typography>
            <Button startIcon={<AddIcon />} onClick={abrirNova}>Cadastrar a primeira</Button>
          </Paper>
        )}
        {filtradas.map((p) => (
          <Paper key={p.id} variant="outlined" sx={{ p: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Checkbox
              checked={selecionadas.has(p.id)}
              onChange={() => alternar(p.id)}
              slotProps={{ input: { "aria-label": `Selecionar ${p.codigo} para etiqueta` } }}
            />
            <Box sx={{ width: 64, height: 64, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
              <FotoPeca peca={p} altura={64} />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography noWrap>
                <b>{p.codigo}</b> · {p.titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {p.categoria} · Tam. {p.tamanho} · {brl(p.preco)} · {tempoRelativo(p.criado_em)}
              </Typography>
              <Chip size="small" label={STATUS_PECA[p.status].rotulo} color={STATUS_PECA[p.status].cor} sx={{ mt: 0.5 }} />
            </Box>
            <Box sx={{ display: "flex", flexShrink: 0 }}>
              {p.status === "triagem" && (
                <Tooltip title="Colocar à venda">
                  <IconButton aria-label={`Colocar ${p.codigo} à venda`} color="primary" onClick={() => colocarAVenda(p)}>
                    <StorefrontIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Etiqueta">
                <IconButton aria-label={`Etiqueta de ${p.codigo}`} onClick={() => setEtiquetas([p])}>
                  <QrCodeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton aria-label={`Editar ${p.codigo}`} onClick={() => { setEditando(p); setDialogo(true); }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              {perfil.papel === "admin" && (
                <Tooltip title="Excluir">
                  <IconButton aria-label={`Excluir ${p.codigo}`} onClick={() => setExcluir(p)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Paper>
        ))}
      </Box>

      <PecaDialog
        aberto={dialogo}
        peca={editando}
        onFechar={fecharDialogo}
        onSalvo={(p, continuar) => {
          aviso(`Peça ${p.codigo} salva.`);
          carregar();
          if (!continuar) fecharDialogo();
        }}
      />
      <EtiquetaDialog pecas={etiquetas} onFechar={() => setEtiquetas([])} />

      <Dialog open={!!excluir} onClose={() => setExcluir(null)}>
        <DialogTitle>Excluir {excluir?.codigo}?</DialogTitle>
        <DialogContent>
          A peça &quot;{excluir?.titulo}&quot; será apagada para sempre. Se ela só saiu do brechó, prefira marcar como
          &quot;Repassada/doada&quot;.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcluir(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmarExclusao}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
