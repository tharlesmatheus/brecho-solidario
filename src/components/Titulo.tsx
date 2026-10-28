import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

/** Cabeçalho padrão das telas do painel (consistência e padrões). */
export default function Titulo({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 3 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h5" component="h1">
          {titulo}
        </Typography>
        {subtitulo && (
          <Typography variant="body2" color="text.secondary">
            {subtitulo}
          </Typography>
        )}
      </Box>
      {acoes && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{acoes}</Box>}
    </Box>
  );
}
