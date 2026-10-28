"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import TopoPublico from "@/components/TopoPublico";
import { FotoPeca } from "@/components/CartaoPeca";
import { sb, mensagemErro } from "@/lib/supabase";
import { brl, linkWhatsApp, type Peca } from "@/lib/tipos";

export default function DetalhePeca() {
  const { id } = useParams<{ id: string }>();
  const [peca, setPeca] = useState<Peca | null | undefined>(undefined);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [reservado, setReservado] = useState(false);

  useEffect(() => {
    sb()
      .from("pecas")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => setPeca(error ? null : (data as Peca | null)));
  }, [id]);

  async function reservar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (telefone.replace(/\D/g, "").length < 10) {
      setErro("Informe o telefone com DDD, por exemplo (77) 99999-0000.");
      return;
    }
    setEnviando(true);
    const { error } = await sb().rpc("reservar_peca", { p_peca: id, p_nome: nome, p_telefone: telefone });
    setEnviando(false);
    if (error) setErro(mensagemErro(error));
    else setReservado(true);
  }

  const whats = peca ? linkWhatsApp(`Olá! Tenho interesse na peça ${peca.codigo} – ${peca.titulo}.`) : null;

  return (
    <>
      <TopoPublico />
      <Container maxWidth="md" component="main" sx={{ py: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }} aria-label="Você está em">
          <Link href="/">Vitrine</Link>
          <Typography color="text.primary">{peca?.titulo ?? "Peça"}</Typography>
        </Breadcrumbs>

        {peca === undefined && <Skeleton variant="rounded" height={420} />}

        {peca === null && (
          <Alert severity="info" action={<Button component={Link} href="/">Ver vitrine</Button>}>
            Esta peça não está mais disponível. Que tal ver as outras?
          </Alert>
        )}

        {peca && (
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <FotoPeca peca={peca} altura={{ xs: 320, md: 440 }} />
            </Paper>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Código {peca.codigo} · {peca.categoria}
              </Typography>
              <Typography variant="h4" component="h1" gutterBottom>
                {peca.titulo}
              </Typography>
              <Typography variant="h4" color="primary" component="p" sx={{ mb: 2 }}>
                {brl(peca.preco)}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <Chip label={`Tamanho ${peca.tamanho}`} />
                <Chip label={peca.genero} />
                <Chip label={`Estado: ${peca.estado}`} variant="outlined" />
                {peca.cor && <Chip label={peca.cor} variant="outlined" />}
              </Box>
              {peca.descricao && <Typography sx={{ mb: 2, whiteSpace: "pre-line" }}>{peca.descricao}</Typography>}

              {reservado ? (
                <Alert severity="success">
                  Reserva feita! A peça fica guardada para você. Retire no brechó e pague na hora (dinheiro ou Pix).
                  {whats && " Se quiser, avise pelo WhatsApp."}
                </Alert>
              ) : peca.status === "disponivel" ? (
                <Paper variant="outlined" component="form" onSubmit={reservar} sx={{ p: 2, display: "grid", gap: 1.5 }}>
                  <Typography variant="subtitle1" component="h2">
                    Reservar para retirar no brechó
                  </Typography>
                  <TextField label="Seu nome" required value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
                  <TextField
                    label="WhatsApp com DDD"
                    required
                    type="tel"
                    inputMode="tel"
                    placeholder="(77) 99999-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    autoComplete="tel"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Usamos seu nome e telefone só para combinar a retirada desta peça.
                  </Typography>
                  {erro && <Alert severity="error">{erro}</Alert>}
                  <Button type="submit" variant="contained" startIcon={<BookmarkAddIcon />} disabled={enviando}>
                    {enviando ? "Reservando…" : "Reservar peça"}
                  </Button>
                </Paper>
              ) : (
                <Alert severity="warning">Esta peça já foi reservada ou vendida.</Alert>
              )}

              {whats && (
                <Button
                  href={whats}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<WhatsAppIcon />}
                  variant="outlined"
                  sx={{ mt: 2 }}
                >
                  Tirar dúvida no WhatsApp
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
