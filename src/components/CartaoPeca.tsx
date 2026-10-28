import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import { brl, type Peca } from "@/lib/tipos";

export function FotoPeca({ peca, altura = 220 }: { peca: Pick<Peca, "foto_url" | "titulo">; altura?: number | { xs: number; md: number } }) {
  return peca.foto_url ? (
    <Box
      component="img"
      src={peca.foto_url}
      alt={`Foto da peça: ${peca.titulo}`}
      loading="lazy"
      sx={{ width: "100%", height: altura, objectFit: "cover", display: "block", bgcolor: "action.hover" }}
    />
  ) : (
    <Box
      role="img"
      aria-label="Peça sem foto"
      sx={{ height: altura, display: "grid", placeItems: "center", bgcolor: "action.hover", color: "text.secondary" }}
    >
      <CheckroomIcon sx={{ fontSize: 56 }} />
    </Box>
  );
}

export default function CartaoPeca({ peca }: { peca: Peca }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={`/peca/${peca.id}`} sx={{ height: "100%", alignItems: "stretch" }}>
        <FotoPeca peca={peca} />
        <CardContent>
          <Typography variant="subtitle1" component="h3" noWrap title={peca.titulo}>
            {peca.titulo}
          </Typography>
          <Typography variant="h6" color="primary" component="p">
            {brl(peca.preco)}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
            <Chip size="small" label={`Tam. ${peca.tamanho}`} />
            <Chip size="small" label={peca.estado} variant="outlined" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
