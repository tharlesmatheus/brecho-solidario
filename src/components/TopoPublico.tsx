"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import RecyclingIcon from "@mui/icons-material/Recycling";
import { NOME_BRECHO } from "@/lib/tipos";

const LINKS = [
  { href: "/", rotulo: "Vitrine" },
  { href: "/sobre", rotulo: "Moda circular" },
  { href: "/avaliar", rotulo: "Avaliar" },
];

export default function TopoPublico() {
  const caminho = usePathname();
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 0.5 }}>
          <Box
            component={Link}
            href="/"
            sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", textDecoration: "none", mr: "auto" }}
          >
            <RecyclingIcon aria-hidden />
            <Typography variant="h6" component="span">
              {NOME_BRECHO}
            </Typography>
          </Box>
          <Box component="nav" aria-label="Menu principal" sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {LINKS.map((l) => (
              <Button
                key={l.href}
                component={Link}
                href={l.href}
                color={caminho === l.href ? "primary" : "inherit"}
                aria-current={caminho === l.href ? "page" : undefined}
                size="small"
              >
                {l.rotulo}
              </Button>
            ))}
            <Button component={Link} href="/painel" variant="outlined" size="small">
              Área da equipe
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
