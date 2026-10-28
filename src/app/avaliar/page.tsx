"use client";

import { useState } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import TopoPublico from "@/components/TopoPublico";
import { sb, mensagemErro } from "@/lib/supabase";

/** System Usability Scale (SUS) — 10 afirmações padrão, versão em português. */
const PERGUNTAS = [
  "Eu acho que gostaria de usar este sistema com frequência.",
  "Eu achei o sistema desnecessariamente complexo.",
  "Eu achei o sistema fácil de usar.",
  "Eu acho que precisaria de ajuda de uma pessoa técnica para usar o sistema.",
  "Eu achei que as funções do sistema estão bem integradas.",
  "Eu achei que o sistema tem muitas inconsistências.",
  "Eu imagino que a maioria das pessoas aprenderia a usar este sistema rapidamente.",
  "Eu achei o sistema muito complicado de usar.",
  "Eu me senti confiante ao usar o sistema.",
  "Eu precisei aprender várias coisas antes de conseguir usar o sistema.",
];
const ESCALA = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"];

export default function Avaliar() {
  const [respostas, setRespostas] = useState<(number | null)[]>(Array(10).fill(null));
  const [perfil, setPerfil] = useState("");
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState("");
  const [nota, setNota] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const faltam = respostas.filter((r) => r === null).length;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (faltam) {
      setErro(`Faltam ${faltam} pergunta(s).`);
      return;
    }
    setEnviando(true);
    setErro("");
    const { data, error } = await sb().rpc("enviar_avaliacao", {
      p_respostas: respostas,
      p_perfil: perfil || null,
      p_comentario: comentario || null,
    });
    setEnviando(false);
    if (error) setErro(mensagemErro(error));
    else setNota(Number(data));
  }

  return (
    <>
      <TopoPublico />
      <Container maxWidth="md" component="main" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Avalie o sistema
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Leva 2 minutos e é anônimo. Sua opinião define as próximas melhorias.
        </Typography>

        {nota !== null ? (
          <Alert severity="success">Obrigado! Sua avaliação foi registrada (nota de usabilidade: {nota.toFixed(1)} de 100).</Alert>
        ) : (
          <Box component="form" onSubmit={enviar} sx={{ display: "grid", gap: 2 }}>
            <TextField select label="Você é" value={perfil} onChange={(e) => setPerfil(e.target.value)} sx={{ maxWidth: 320 }}>
              <MenuItem value="">Prefiro não dizer</MenuItem>
              <MenuItem value="Voluntário">Voluntário(a) do brechó</MenuItem>
              <MenuItem value="Cliente">Cliente</MenuItem>
              <MenuItem value="Doador">Doador(a)</MenuItem>
              <MenuItem value="Coordenação">Coordenação</MenuItem>
            </TextField>

            {PERGUNTAS.map((p, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <FormControl required>
                  <FormLabel id={`q${i}`} sx={{ color: "text.primary", mb: 1 }}>
                    {i + 1}. {p}
                  </FormLabel>
                  <RadioGroup
                    aria-labelledby={`q${i}`}
                    row
                    value={respostas[i] ?? ""}
                    onChange={(e) => {
                      const nova = [...respostas];
                      nova[i] = Number(e.target.value);
                      setRespostas(nova);
                    }}
                  >
                    {ESCALA.map((rot, j) => (
                      <FormControlLabel key={j} value={j + 1} control={<Radio />} label={rot} />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Paper>
            ))}

            <TextField
              label="O que poderia melhorar? (opcional)"
              multiline
              minRows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
            {erro && <Alert severity="error">{erro}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={enviando} sx={{ justifySelf: "start" }}>
              {enviando ? "Enviando…" : faltam ? `Enviar (faltam ${faltam})` : "Enviar avaliação"}
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
}
