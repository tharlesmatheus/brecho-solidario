"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Titulo from "@/components/Titulo";
import { useAviso } from "@/components/Providers";
import { useEquipe } from "@/components/PerfilContext";
import { sb, mensagemErro } from "@/lib/supabase";
import { data, type Papel, type Perfil } from "@/lib/tipos";

const PAPEIS: { valor: Papel; rotulo: string }[] = [
  { valor: "pendente", rotulo: "Sem acesso (pendente)" },
  { valor: "voluntario", rotulo: "Voluntário" },
  { valor: "admin", rotulo: "Coordenação (admin)" },
];

export default function Equipe() {
  const aviso = useAviso();
  const { perfil, membros, recarregarMembros } = useEquipe();

  if (perfil.papel !== "admin") return <Alert severity="warning">Só a coordenação acessa esta tela.</Alert>;

  const admins = membros.filter((m) => m.papel === "admin").length;
  const pendentes = membros.filter((m) => m.papel === "pendente");

  async function mudarPapel(m: Perfil, papel: Papel) {
    if (m.id === perfil.id && papel !== "admin" && admins <= 1) {
      aviso("Você é o único administrador. Promova outra pessoa antes.", "warning");
      return;
    }
    const { error } = await sb().from("profiles").update({ papel }).eq("id", m.id);
    if (error) return aviso(mensagemErro(error), "error");
    aviso(`${m.nome} agora é: ${PAPEIS.find((p) => p.valor === papel)?.rotulo}.`);
    recarregarMembros();
  }

  return (
    <>
      <Titulo titulo="Voluntários" subtitulo="Aprove quem se cadastrou e defina o que cada pessoa pode fazer" />
      {pendentes.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {pendentes.length} pessoa(s) aguardando aprovação.
        </Alert>
      )}
      <Box sx={{ display: "grid", gap: 1 }}>
        {[...pendentes, ...membros.filter((m) => m.papel !== "pendente")].map((m) => (
          <Paper key={m.id} variant="outlined" sx={{ p: 1.5, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <Avatar aria-hidden>{(m.nome || "?").charAt(0).toUpperCase()}</Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 160 }}>
              <Typography>
                {m.nome || "Sem nome"} {m.id === perfil.id && <Chip size="small" label="Você" />}
              </Typography>
              <Typography variant="body2" color="text.secondary">Desde {data(m.criado_em)}</Typography>
            </Box>
            <TextField
              select
              size="small"
              label="Acesso"
              value={m.papel}
              onChange={(e) => mudarPapel(m, e.target.value as Papel)}
              sx={{ width: 230 }}
            >
              {PAPEIS.map((p) => <MenuItem key={p.valor} value={p.valor}>{p.rotulo}</MenuItem>)}
            </TextField>
          </Paper>
        ))}
      </Box>
    </>
  );
}
