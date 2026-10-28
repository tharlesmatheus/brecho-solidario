"use client";

import { useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import useMediaQuery from "@mui/material/useMediaQuery";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { FotoPeca } from "@/components/CartaoPeca";
import { sb, mensagemErro } from "@/lib/supabase";
import { comprimirImagem } from "@/lib/imagem";
import { CATEGORIAS, ESTADOS, GENEROS, STATUS_PECA, TAMANHOS, data, type Doacao, type Peca, type StatusPeca } from "@/lib/tipos";

type Form = {
  titulo: string;
  descricao: string;
  categoria: string;
  tamanho: string;
  genero: string;
  cor: string;
  estado: string;
  preco: string;
  status: StatusPeca;
  doacao_id: string;
  foto_url: string | null;
};

const VAZIO: Form = {
  titulo: "",
  descricao: "",
  categoria: "Camisetas",
  tamanho: "M",
  genero: "Unissex",
  cor: "",
  estado: "Bom",
  preco: "",
  status: "triagem",
  doacao_id: "",
  foto_url: null,
};

export default function PecaDialog(props: {
  aberto: boolean;
  peca: Peca | null;
  doacaoInicial?: string;
  onFechar: () => void;
  onSalvo: (p: Peca, continuar: boolean) => void;
}) {
  const telaCheia = useMediaQuery("(max-width:600px)");
  const [f, setF] = useState<Form>(VAZIO);
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const inputFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!props.aberto) return;
    setErro("");
    setArquivo(null);
    setPrevia(null);
    const p = props.peca;
    setF(
      p
        ? {
            titulo: p.titulo,
            descricao: p.descricao ?? "",
            categoria: p.categoria,
            tamanho: p.tamanho,
            genero: p.genero,
            cor: p.cor ?? "",
            estado: p.estado,
            preco: String(p.preco).replace(".", ","),
            status: p.status,
            doacao_id: p.doacao_id ?? "",
            foto_url: p.foto_url,
          }
        : { ...VAZIO, doacao_id: props.doacaoInicial ?? "" }
    );
    sb()
      .from("doacoes")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(30)
      .then(({ data }) => setDoacoes((data as Doacao[]) ?? []));
  }, [props.aberto, props.peca, props.doacaoInicial]);

  useEffect(() => {
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const set = (campo: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [campo]: e.target.value });

  async function salvar(continuar: boolean) {
    setErro("");
    const preco = Number(f.preco.replace(/\./g, "").replace(",", "."));
    if (!f.titulo.trim()) return setErro("Dê um nome para a peça (ex.: Camisa xadrez manga longa).");
    if (Number.isNaN(preco) || preco < 0) return setErro("Preço inválido. Use números, ex.: 15,00.");
    if (f.status === "disponivel" && preco <= 0) return setErro("Defina um preço antes de colocar à venda.");

    setSalvando(true);
    try {
      let foto_url = f.foto_url;
      if (arquivo) {
        const blob = await comprimirImagem(arquivo);
        const caminho = `${new Date().getFullYear()}/${crypto.randomUUID()}.jpg`;
        const up = await sb().storage.from("pecas").upload(caminho, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (up.error) throw up.error;
        foto_url = sb().storage.from("pecas").getPublicUrl(caminho).data.publicUrl;
      }
      const registro = {
        titulo: f.titulo.trim(),
        descricao: f.descricao.trim() || null,
        categoria: f.categoria,
        tamanho: f.tamanho,
        genero: f.genero,
        cor: f.cor.trim() || null,
        estado: f.estado,
        preco,
        status: f.status,
        doacao_id: f.doacao_id || null,
        foto_url,
      };
      const q = props.peca
        ? sb().from("pecas").update(registro).eq("id", props.peca.id).select().single()
        : sb().from("pecas").insert(registro).select().single();
      const { data, error } = await q;
      if (error) throw error;
      props.onSalvo(data as Peca, continuar);
      if (continuar) {
        // mantém categoria/tamanho/doação para agilizar o cadastro em série (eficiência de uso)
        setF({ ...VAZIO, categoria: f.categoria, tamanho: f.tamanho, genero: f.genero, doacao_id: f.doacao_id });
        setArquivo(null);
        setPrevia(null);
      }
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  // Peças vendidas/reservadas mudam de status pelo caixa e pelas reservas, não aqui (prevenção de erros).
  const statusEditaveis: StatusPeca[] =
    props.peca && (props.peca.status === "vendida" || props.peca.status === "reservada")
      ? [props.peca.status]
      : ["triagem", "disponivel", "repassada"];

  return (
    <Dialog open={props.aberto} onClose={props.onFechar} fullScreen={telaCheia} fullWidth maxWidth="sm">
      <DialogTitle>{props.peca ? `Editar peça ${props.peca.codigo}` : "Cadastrar peça"}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
          <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 2, alignItems: "center" }}>
            <Box sx={{ width: 96, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
              <FotoPeca peca={{ foto_url: previa ?? f.foto_url, titulo: f.titulo || "nova peça" }} altura={96} />
            </Box>
            <input
              ref={inputFoto}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
            <Button variant="outlined" startIcon={<PhotoCameraIcon />} onClick={() => inputFoto.current?.click()}>
              {previa || f.foto_url ? "Trocar foto" : "Tirar / escolher foto"}
            </Button>
          </Box>
          <TextField label="Nome da peça" required value={f.titulo} onChange={set("titulo")} sx={{ gridColumn: "1 / -1" }} placeholder="Ex.: Vestido floral midi" />
          <TextField select label="Categoria" value={f.categoria} onChange={set("categoria")}>
            {CATEGORIAS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>
          <TextField select label="Tamanho" value={f.tamanho} onChange={set("tamanho")}>
            {TAMANHOS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>
          <TextField select label="Para" value={f.genero} onChange={set("genero")}>
            {GENEROS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>
          <TextField select label="Estado" value={f.estado} onChange={set("estado")}>
            {ESTADOS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>
          <TextField label="Cor" value={f.cor} onChange={set("cor")} />
          <TextField
            label="Preço"
            value={f.preco}
            onChange={set("preco")}
            inputMode="decimal"
            placeholder="0,00"
            slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
          />
          <TextField select label="Situação" value={f.status} onChange={set("status")} disabled={statusEditaveis.length === 1}>
            {statusEditaveis.map((s) => <MenuItem key={s} value={s}>{STATUS_PECA[s].rotulo}</MenuItem>)}
          </TextField>
          <TextField select label="Veio da doação" value={f.doacao_id} onChange={set("doacao_id")}>
            <MenuItem value="">Não informado</MenuItem>
            {doacoes.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.doador_nome} · {data(d.criado_em)}</MenuItem>
            ))}
          </TextField>
          <TextField label="Descrição (opcional)" multiline minRows={2} value={f.descricao} onChange={set("descricao")} sx={{ gridColumn: "1 / -1" }} placeholder="Detalhes, medidas, marca…" />
        </Box>
        {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button onClick={props.onFechar} disabled={salvando}>Cancelar</Button>
        {!props.peca && (
          <Button onClick={() => salvar(true)} disabled={salvando}>Salvar e cadastrar outra</Button>
        )}
        <Button variant="contained" onClick={() => salvar(false)} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
