"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import SearchIcon from "@mui/icons-material/Search";
import TopoPublico from "@/components/TopoPublico";
import CartaoPeca from "@/components/CartaoPeca";
import { sb, mensagemErro } from "@/lib/supabase";
import { CATEGORIAS, GENEROS, TAMANHOS, type Peca } from "@/lib/tipos";

interface Impacto {
  reaproveitadas: number;
  disponiveis: number;
  doacoes: number;
}

export default function Vitrine() {
  const [pecas, setPecas] = useState<Peca[] | null>(null);
  const [impacto, setImpacto] = useState<Impacto | null>(null);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [genero, setGenero] = useState("");
  const [ordem, setOrdem] = useState("recentes");

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          sb().from("pecas").select("*").eq("status", "disponivel").order("criado_em", { ascending: false }).limit(500),
          sb().rpc("impacto_publico"),
        ]);
        if (r1.error) throw r1.error;
        setPecas((r1.data as Peca[]) ?? []);
        if (!r2.error) setImpacto(r2.data as Impacto);
      } catch (e) {
        setErro(mensagemErro(e));
        setPecas([]);
      }
    })();
  }, []);

  const filtradas = useMemo(() => {
    if (!pecas) return [];
    const termo = busca.trim().toLowerCase();
    const lista = pecas.filter(
      (p) =>
        (!termo || `${p.titulo} ${p.descricao ?? ""} ${p.cor ?? ""}`.toLowerCase().includes(termo)) &&
        (!categoria || p.categoria === categoria) &&
        (!tamanho || p.tamanho === tamanho) &&
        (!genero || p.genero === genero)
    );
    if (ordem === "menor") lista.sort((a, b) => a.preco - b.preco);
    if (ordem === "maior") lista.sort((a, b) => b.preco - a.preco);
    return lista;
  }, [pecas, busca, categoria, tamanho, genero, ordem]);

  const temFiltro = busca || categoria || tamanho || genero;

  return (
    <>
      <TopoPublico />
      <Container maxWidth="lg" component="main" sx={{ py: 3 }}>
        <Paper
          elevation={0}
          sx={{ p: { xs: 2.5, md: 4 }, mb: 3, bgcolor: "primary.main", color: "primary.contrastText" }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Roupa boa merece uma segunda história
          </Typography>
          <Typography sx={{ maxWidth: 640, opacity: 0.95 }}>
            Peças doadas pela comunidade, revisadas pelos voluntários e vendidas a preço justo. Cada compra tira
            uma roupa do lixo e ajuda a obra social.
          </Typography>
          {impacto && (
            <Box sx={{ display: "flex", gap: 4, mt: 2.5, flexWrap: "wrap" }} aria-label="Nosso impacto">
              <Numero valor={impacto.reaproveitadas} rotulo="peças reaproveitadas" />
              <Numero valor={impacto.disponiveis} rotulo="à venda agora" />
              <Numero valor={impacto.doacoes} rotulo="peças doadas" />
            </Box>
          )}
        </Paper>

        <Box
          component="form"
          role="search"
          onSubmit={(e) => e.preventDefault()}
          sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1fr 1fr 1fr 1fr" }, mb: 3 }}
        >
          <TextField
            label="Buscar"
            placeholder="Ex.: vestido azul"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
          />
          <Filtro rotulo="Categoria" valor={categoria} onChange={setCategoria} opcoes={CATEGORIAS} />
          <Filtro rotulo="Tamanho" valor={tamanho} onChange={setTamanho} opcoes={TAMANHOS} />
          <Filtro rotulo="Para" valor={genero} onChange={setGenero} opcoes={GENEROS} />
          <TextField select label="Ordenar" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <MenuItem value="recentes">Mais recentes</MenuItem>
            <MenuItem value="menor">Menor preço</MenuItem>
            <MenuItem value="maior">Maior preço</MenuItem>
          </TextField>
        </Box>

        {erro && <Alert severity="error" sx={{ mb: 2 }}>Não foi possível carregar a vitrine: {erro}</Alert>}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} aria-live="polite">
          {pecas ? `${filtradas.length} peça(s) encontrada(s)` : "Carregando peças…"}
        </Typography>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))" }}>
          {!pecas &&
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} variant="rounded" height={330} />)}
          {filtradas.map((p) => (
            <CartaoPeca key={p.id} peca={p} />
          ))}
        </Box>

        {pecas && filtradas.length === 0 && !erro && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography gutterBottom>Nenhuma peça com esses filtros.</Typography>
            {temFiltro && (
              <Button
                onClick={() => {
                  setBusca("");
                  setCategoria("");
                  setTamanho("");
                  setGenero("");
                }}
              >
                Limpar filtros
              </Button>
            )}
          </Box>
        )}
      </Container>
    </>
  );
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <Box>
      <Typography variant="h4" component="p" sx={{ fontWeight: 700, lineHeight: 1 }}>
        {valor.toLocaleString("pt-BR")}
      </Typography>
      <Typography variant="body2">{rotulo}</Typography>
    </Box>
  );
}

function Filtro(props: { rotulo: string; valor: string; onChange: (v: string) => void; opcoes: string[] }) {
  return (
    <TextField select label={props.rotulo} value={props.valor} onChange={(e) => props.onChange(e.target.value)}>
      <MenuItem value="">Todos</MenuItem>
      {props.opcoes.map((o) => (
        <MenuItem key={o} value={o}>
          {o}
        </MenuItem>
      ))}
    </TextField>
  );
}
