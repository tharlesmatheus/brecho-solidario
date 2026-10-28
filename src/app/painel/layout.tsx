"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory2";
import VolunteerIcon from "@mui/icons-material/VolunteerActivism";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import CampaignIcon from "@mui/icons-material/Campaign";
import TaskIcon from "@mui/icons-material/TaskAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import GroupIcon from "@mui/icons-material/Group";
import HelpIcon from "@mui/icons-material/HelpOutline";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { sb } from "@/lib/supabase";
import { NOME_BRECHO, type Perfil } from "@/lib/tipos";
import { PerfilCtx } from "@/components/PerfilContext";

const LARGURA = 264;

const MENU = [
  {
    grupo: "Dia a dia",
    itens: [
      { href: "/painel", rotulo: "Início", icone: <DashboardIcon /> },
      { href: "/painel/vendas", rotulo: "Caixa / Vendas", icone: <PointOfSaleIcon /> },
      { href: "/painel/estoque", rotulo: "Estoque", icone: <InventoryIcon /> },
      { href: "/painel/doacoes", rotulo: "Doações", icone: <VolunteerIcon /> },
      { href: "/painel/reservas", rotulo: "Reservas", icone: <BookmarkIcon /> },
    ],
  },
  {
    grupo: "Equipe",
    itens: [
      { href: "/painel/mural", rotulo: "Mural de avisos", icone: <CampaignIcon /> },
      { href: "/painel/tarefas", rotulo: "Tarefas e escala", icone: <TaskIcon /> },
      { href: "/painel/relatorios", rotulo: "Relatórios", icone: <BarChartIcon /> },
      { href: "/painel/equipe", rotulo: "Voluntários", icone: <GroupIcon /> },
    ],
  },
  {
    grupo: "Outros",
    itens: [
      { href: "/painel/conta", rotulo: "Minha conta", icone: <PersonIcon /> },
      { href: "/painel/ajuda", rotulo: "Como usar", icone: <HelpIcon /> },
      { href: "/", rotulo: "Ver vitrine", icone: <StorefrontIcon /> },
    ],
  },
];

export default function PainelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const caminho = usePathname();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [membros, setMembros] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);

  const recarregarMembros = useCallback(async () => {
    const { data } = await sb().from("profiles").select("*").order("nome");
    setMembros((data as Perfil[]) ?? []);
  }, []);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      const { data } = await sb().auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) {
        router.replace("/login");
        return;
      }
      const { data: p } = await sb().from("profiles").select("*").eq("id", uid).maybeSingle();
      if (!ativo) return;
      setPerfil((p as Perfil) ?? null);
      if (p && (p as Perfil).papel !== "pendente") await recarregarMembros();
      setCarregando(false);
    }
    carregar();
    const { data: sub } = sb().auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") router.replace("/login");
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [router, recarregarMembros]);

  async function sair() {
    await sb().auth.signOut();
    router.replace("/login");
  }

  if (carregando) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }} role="status" aria-label="Carregando">
        <CircularProgress />
      </Box>
    );
  }

  if (!perfil || perfil.papel === "pendente") {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh", p: 2 }}>
        <Paper variant="outlined" sx={{ p: 4, maxWidth: 420, textAlign: "center" }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Cadastro aguardando aprovação
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Olá{perfil?.nome ? `, ${perfil.nome}` : ""}! Peça para a coordenação do brechó aprovar seu acesso em
            &quot;Voluntários&quot;. Depois é só entrar de novo.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Já fui aprovado
            </Button>
            <Button onClick={sair}>Sair</Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  const menu = (
    <Box component="nav" aria-label="Menu do painel" sx={{ width: LARGURA }}>
      <Toolbar>
        <Typography variant="h6" color="primary" noWrap>
          {NOME_BRECHO}
        </Typography>
      </Toolbar>
      {MENU.map((g) => (
        <List key={g.grupo} dense subheader={<ListSubheader disableSticky>{g.grupo}</ListSubheader>}>
          {g.itens
            .filter((i) => i.href !== "/painel/equipe" || perfil.papel === "admin")
            .map((i) => {
              const ativoItem = i.href === "/painel" ? caminho === "/painel" : caminho.startsWith(i.href) && i.href !== "/";
              return (
                <ListItemButton
                  key={i.href}
                  component={Link}
                  href={i.href}
                  selected={ativoItem}
                  aria-current={ativoItem ? "page" : undefined}
                  onClick={() => setAberto(false)}
                  sx={{ borderRadius: 999, mx: 1.5, my: 0.25 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{i.icone}</ListItemIcon>
                  <ListItemText primary={i.rotulo} />
                </ListItemButton>
              );
            })}
        </List>
      ))}
    </Box>
  );

  return (
    <PerfilCtx.Provider value={{ perfil, membros, recarregarMembros }}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider", width: { md: `calc(100% - ${LARGURA}px)` }, ml: { md: `${LARGURA}px` } }}
        >
          <Toolbar>
            <IconButton edge="start" aria-label="Abrir menu" onClick={() => setAberto(true)} sx={{ mr: 1, display: { md: "none" } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }} noWrap>
              Olá, {perfil.nome || "voluntário"} {perfil.papel === "admin" && "· Coordenação"}
            </Typography>
            <Tooltip title="Sair">
              <IconButton aria-label="Sair" onClick={sair}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Drawer variant="temporary" open={aberto} onClose={() => setAberto(false)} sx={{ display: { xs: "block", md: "none" } }}>
          {menu}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, width: LARGURA, flexShrink: 0, "& .MuiDrawer-paper": { width: LARGURA } }}
        >
          {menu}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 }, mt: 8 }}>
          {children}
        </Box>
      </Box>
    </PerfilCtx.Provider>
  );
}
