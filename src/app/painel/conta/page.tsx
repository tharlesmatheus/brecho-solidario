"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Titulo from "@/components/Titulo";
import { useAviso } from "@/components/Providers";
import { useEquipe } from "@/components/PerfilContext";
import { sb, mensagemErro } from "@/lib/supabase";

export default function Conta() {
  const aviso = useAviso();
  const { perfil, recarregarMembros } = useEquipe();
  const [nome, setNome] = useState(perfil.nome);
  const [senha, setSenha] = useState("");

  async function salvarNome(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await sb().from("profiles").update({ nome: nome.trim() }).eq("id", perfil.id);
    if (error) return aviso(mensagemErro(error), "error");
    aviso("Nome atualizado. Recarregue a página para ver no topo.");
    recarregarMembros();
  }

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return aviso("A senha precisa ter pelo menos 8 caracteres.", "warning");
    const { error } = await sb().auth.updateUser({ password: senha });
    if (error) return aviso(mensagemErro(error), "error");
    setSenha("");
    aviso("Senha alterada.");
  }

  return (
    <>
      <Titulo titulo="Minha conta" />
      <Box sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
        <Paper variant="outlined" component="form" onSubmit={salvarNome} sx={{ p: 2, display: "grid", gap: 2 }}>
          <Typography variant="h6" component="h2">Seu nome</Typography>
          <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Button type="submit" variant="contained" sx={{ justifySelf: "start" }}>Salvar nome</Button>
        </Paper>
        <Paper variant="outlined" component="form" onSubmit={trocarSenha} sx={{ p: 2, display: "grid", gap: 2 }}>
          <Typography variant="h6" component="h2">Nova senha</Typography>
          <TextField label="Nova senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" helperText="Mínimo de 8 caracteres" />
          <Button type="submit" variant="outlined" sx={{ justifySelf: "start" }}>Trocar senha</Button>
        </Paper>
      </Box>
    </>
  );
}
