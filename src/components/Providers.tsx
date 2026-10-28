"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

/**
 * Tema inspirado no Material Design 3: cores tonais a partir de uma semente verde
 * (sustentabilidade), cantos arredondados maiores, botões em formato de pílula
 * e tipografia Roboto. Modo claro e escuro seguem o sistema do usuário.
 */
const tema = createTheme({
  cssVariables: { colorSchemeSelector: "media" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#2E6B47", contrastText: "#FFFFFF" },
        secondary: { main: "#7A5A2E", contrastText: "#FFFFFF" },
        background: { default: "#F6FBF4", paper: "#FFFFFF" },
        success: { main: "#2E7D32" },
        warning: { main: "#B26A00" },
        info: { main: "#2F5E8C" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#93D5A9", contrastText: "#00391E" },
        secondary: { main: "#E8BE87", contrastText: "#422C05" },
        background: { default: "#101511", paper: "#1A211C" },
      },
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 500, letterSpacing: 0.1 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 999, paddingInline: 20, minHeight: 40 } } },
    MuiFab: { styleOverrides: { root: { borderRadius: 16 } } },
    MuiCard: { defaultProps: { variant: "outlined" }, styleOverrides: { root: { borderRadius: 16 } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 28 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
  },
});

type Severidade = "success" | "error" | "info" | "warning";
const AvisoCtx = createContext<(msg: string, sev?: Severidade) => void>(() => {});

/** Mostra mensagens de feedback (heurística: visibilidade do status do sistema). */
export const useAviso = () => useContext(AvisoCtx);

export default function Providers({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ msg: string; sev: Severidade; chave: number } | null>(null);
  const mostrar = useCallback((msg: string, sev: Severidade = "success") => {
    setAviso({ msg, sev, chave: Date.now() });
  }, []);

  return (
    <ThemeProvider theme={tema}>
      <CssBaseline enableColorScheme />
      <AvisoCtx.Provider value={mostrar}>
        {children}
        <Snackbar
          key={aviso?.chave}
          open={!!aviso}
          autoHideDuration={aviso?.sev === "error" ? 7000 : 3500}
          onClose={(_, motivo) => motivo !== "clickaway" && setAviso(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={aviso?.sev} variant="filled" onClose={() => setAviso(null)} sx={{ width: "100%" }}>
            {aviso?.msg}
          </Alert>
        </Snackbar>
      </AvisoCtx.Provider>
    </ThemeProvider>
  );
}
