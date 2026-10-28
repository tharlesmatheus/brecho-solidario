"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import SendIcon from "@mui/icons-material/Send";
import Titulo from "@/components/Titulo";
import { useAviso } from "@/components/Providers";
import { useEquipe, nomeDe } from "@/components/PerfilContext";
import { sb, mensagemErro } from "@/lib/supabase";
import { tempoRelativo } from "@/lib/tipos";

interface Aviso { id: string; texto: string; autor_id: string | null; criado_em: string }

export default function Mural() {
  const aviso = useAviso();
  const { perfil, membros } = useEquipe();
  const [lista, setLista] = useState<Aviso[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await sb().from("avisos").select("*").order("criado_em", { ascending: false }).limit(100);
    setLista((data as Aviso[]) ?? []);
  }, []);

  useEffect(() => {
    carregar();
    const canal = sb()
      .channel("mural")
      .on("postgres_changes", { event: "*", schema: "public", table: "avisos" }, () => carregar())
      .subscribe();
    return () => {
      sb().removeChannel(canal);
    };
  }, [carregar]);

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    const { error } = await sb().from("avisos").insert({ texto: texto.trim() });
    setEnviando(false);
    if (error) return aviso(mensagemErro(error), "error");
    setTexto("");
    carregar();
  }

  async function apagar(id: string) {
    const { error } = await sb().from("avisos").delete().eq("id", id);
    if (error) return aviso(mensagemErro(error), "error");
    carregar();
  }

  return (
    <>
      <Titulo titulo="Mural de avisos" subtitulo="Recados para toda a equipe do brechó" />
      <Paper variant="outlined" component="form" onSubmit={publicar} sx={{ p: 2, mb: 3, display: "grid", gap: 1.5 }}>
        <TextField
          label="Escreva um aviso"
          multiline
          minRows={2}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex.: Sábado chegam 3 sacolas de doação, preciso de 2 pessoas na triagem."
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />
        <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={enviando || !texto.trim()} sx={{ justifySelf: "end" }}>
          Publicar
        </Button>
      </Paper>

      <Box sx={{ display: "grid", gap: 1.5 }}>
        {lista.length === 0 && <Typography color="text.secondary">Nenhum aviso ainda.</Typography>}
        {lista.map((a) => {
          const autor = nomeDe(membros, a.autor_id);
          return (
            <Paper key={a.id} variant="outlined" sx={{ p: 2, display: "flex", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "primary.main" }} aria-hidden>{autor.charAt(0).toUpperCase()}</Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">
                  {autor} <Typography component="span" variant="caption" color="text.secondary">· {tempoRelativo(a.criado_em)}</Typography>
                </Typography>
                <Typography sx={{ whiteSpace: "pre-line" }}>{a.texto}</Typography>
              </Box>
              {(a.autor_id === perfil.id || perfil.papel === "admin") && (
                <IconButton aria-label="Apagar aviso" onClick={() => apagar(a.id)} sx={{ alignSelf: "flex-start" }}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Paper>
          );
        })}
      </Box>
    </>
  );
}
