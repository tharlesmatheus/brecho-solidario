"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import TopoPublico from "@/components/TopoPublico";
import { sb, mensagemErro } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [aba, setAba] = useState<"entrar" | "cadastrar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setInfo("");
    setCarregando(true);
    try {
      if (aba === "entrar") {
        const { error } = await sb().auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        router.replace("/painel");
      } else {
        if (senha.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
        const { data, error } = await sb().auth.signUp({
          email,
          password: senha,
          options: { data: { nome: nome.trim() }, emailRedirectTo: `${window.location.origin}/painel` },
        });
        if (error) throw error;
        if (data.session) router.replace("/painel");
        else setInfo("Cadastro feito! Confirme pelo link enviado ao seu e-mail e depois entre.");
      }
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }

  async function esqueciSenha() {
    setErro("");
    if (!email) {
      setErro("Digite seu e-mail no campo acima e clique de novo.");
      return;
    }
    const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/painel/conta` });
    if (error) setErro(mensagemErro(error));
    else setInfo("Enviamos um link para redefinir a senha.");
  }

  return (
    <>
      <TopoPublico />
      <Container maxWidth="xs" component="main" sx={{ py: 5 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Área da equipe
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Para voluntários e coordenação do brechó. Novos cadastros precisam ser aprovados pela coordenação.
          </Typography>
          <Tabs value={aba} onChange={(_, v) => setAba(v)} variant="fullWidth" sx={{ mb: 2 }}>
            <Tab value="entrar" label="Entrar" />
            <Tab value="cadastrar" label="Criar conta" />
          </Tabs>
          <Box component="form" onSubmit={enviar} sx={{ display: "grid", gap: 2 }}>
            {aba === "cadastrar" && (
              <TextField label="Seu nome" required value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
            )}
            <TextField label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <TextField
              label="Senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={aba === "entrar" ? "current-password" : "new-password"}
              helperText={aba === "cadastrar" ? "Mínimo de 8 caracteres" : undefined}
            />
            {erro && <Alert severity="error">{erro}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={carregando}>
              {carregando ? "Aguarde…" : aba === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
            {aba === "entrar" && (
              <Button onClick={esqueciSenha} size="small">
                Esqueci minha senha
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
}
