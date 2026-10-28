"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import VolunteerIcon from "@mui/icons-material/VolunteerActivism";
import Titulo from "@/components/Titulo";
import { useEquipe, nomeDe } from "@/components/PerfilContext";
import { sb } from "@/lib/supabase";
import { brl, tempoRelativo, data as fmtData } from "@/lib/tipos";

interface Atividade { id: number; autor_id: string | null; descricao: string; criado_em: string }
interface Aviso { id: string; texto: string; autor_id: string | null; criado_em: string }
interface Tarefa { id: string; titulo: string; status: string; data_prevista: string | null }

export default function Inicio() {
  const { perfil, membros } = useEquipe();
  const [resumo, setResumo] = useState({ vendasHoje: 0, totalHoje: 0, aVenda: 0, triagem: 0, reservas: 0 });
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  const carregar = useCallback(async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const c = sb();
    const [vendas, aVenda, triagem, reservas, ativ, av, tar] = await Promise.all([
      c.from("vendas").select("total").eq("cancelada", false).gte("criado_em", hoje.toISOString()),
      c.from("pecas").select("id", { count: "exact", head: true }).eq("status", "disponivel"),
      c.from("pecas").select("id", { count: "exact", head: true }).eq("status", "triagem"),
      c.from("reservas").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      c.from("atividades").select("*").order("criado_em", { ascending: false }).limit(15),
      c.from("avisos").select("*").order("criado_em", { ascending: false }).limit(3),
      c.from("tarefas").select("id,titulo,status,data_prevista").eq("responsavel_id", perfil.id).neq("status", "feito").order("data_prevista", { nullsFirst: false }).limit(5),
    ]);
    const v = (vendas.data as { total: number }[]) ?? [];
    setResumo({
      vendasHoje: v.length,
      totalHoje: v.reduce((s, x) => s + Number(x.total), 0),
      aVenda: aVenda.count ?? 0,
      triagem: triagem.count ?? 0,
      reservas: reservas.count ?? 0,
    });
    setAtividades((ativ.data as Atividade[]) ?? []);
    setAvisos((av.data as Aviso[]) ?? []);
    setTarefas((tar.data as Tarefa[]) ?? []);
  }, [perfil.id]);

  useEffect(() => {
    carregar();
    // Percepção em tempo real: o feed atualiza sozinho quando alguém da equipe faz algo.
    const canal = sb()
      .channel("inicio")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "atividades" }, (p) =>
        setAtividades((a) => [p.new as Atividade, ...a].slice(0, 15))
      )
      .subscribe();
    return () => {
      sb().removeChannel(canal);
    };
  }, [carregar]);

  const cartoes = [
    { rotulo: "Vendido hoje", valor: brl(resumo.totalHoje), detalhe: `${resumo.vendasHoje} venda(s)`, href: "/painel/vendas" },
    { rotulo: "À venda", valor: resumo.aVenda, detalhe: "peças na vitrine", href: "/painel/estoque?status=disponivel" },
    { rotulo: "Em triagem", valor: resumo.triagem, detalhe: "aguardando revisão/preço", href: "/painel/estoque?status=triagem" },
    { rotulo: "Reservas", valor: resumo.reservas, detalhe: "aguardando retirada", href: "/painel/reservas" },
  ];

  return (
    <>
      <Titulo
        titulo="Início"
        subtitulo="Resumo do brechó e o que a equipe está fazendo"
        acoes={
          <>
            <Button variant="contained" startIcon={<PointOfSaleIcon />} component={Link} href="/painel/vendas">
              Nova venda
            </Button>
            <Button variant="outlined" startIcon={<AddIcon />} component={Link} href="/painel/estoque?nova=1">
              Cadastrar peça
            </Button>
            <Button variant="outlined" startIcon={<VolunteerIcon />} component={Link} href="/painel/doacoes?nova=1">
              Registrar doação
            </Button>
          </>
        }
      />

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, mb: 3 }}>
        {cartoes.map((c) => (
          <Card key={c.rotulo}>
            <CardActionArea component={Link} href={c.href} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{c.rotulo}</Typography>
                <Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>{c.valor}</Typography>
                <Typography variant="caption" color="text.secondary">{c.detalhe}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" } }}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2">O que está acontecendo</Typography>
            <Typography variant="caption" color="text.secondary">Atualiza sozinho</Typography>
            <List dense aria-live="polite">
              {atividades.length === 0 && <ListItem><ListItemText primary="Nenhuma atividade ainda." /></ListItem>}
              {atividades.map((a) => (
                <ListItem key={a.id} disableGutters divider>
                  <ListItemText
                    primary={<><b>{a.autor_id ? nomeDe(membros, a.autor_id) : "Visitante"}</b> {a.descricao}</>}
                    secondary={tempoRelativo(a.criado_em)}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gap: 2, alignContent: "start" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>Minhas tarefas</Typography>
              {tarefas.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nenhuma tarefa pendente para você.</Typography>
              ) : (
                <List dense>
                  {tarefas.map((t) => (
                    <ListItem key={t.id} disableGutters>
                      <ListItemText primary={t.titulo} secondary={t.data_prevista ? `Até ${fmtData(t.data_prevista + "T12:00:00")}` : undefined} />
                      <Chip size="small" label={t.status === "fazendo" ? "Fazendo" : "A fazer"} />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button component={Link} href="/painel/tarefas" size="small">Ver todas</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>Últimos avisos</Typography>
              {avisos.length === 0 && <Typography variant="body2" color="text.secondary">Nenhum aviso.</Typography>}
              {avisos.map((a, i) => (
                <Box key={a.id}>
                  {i > 0 && <Divider sx={{ my: 1 }} />}
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{a.texto}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {nomeDe(membros, a.autor_id)} · {tempoRelativo(a.criado_em)}
                  </Typography>
                </Box>
              ))}
              <Box><Button component={Link} href="/painel/mural" size="small">Abrir mural</Button></Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
}
