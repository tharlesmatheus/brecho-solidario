"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PrintIcon from "@mui/icons-material/Print";
import { brl, type Peca } from "@/lib/tipos";

/**
 * Etiqueta com QR code. O QR leva à página da peça na vitrine; o código (P00001)
 * em letras grandes é o que se digita no caixa.
 */
export default function EtiquetaDialog({ pecas, onFechar }: { pecas: Peca[]; onFechar: () => void }) {
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pecas.length) return;
    Promise.all(
      pecas.map(async (p) => [p.id, await QRCode.toDataURL(`${window.location.origin}/peca/${p.id}`, { margin: 1, width: 160 })] as const)
    ).then((pares) => setQrs(Object.fromEntries(pares)));
  }, [pecas]);

  return (
    <Dialog open={pecas.length > 0} onClose={onFechar} fullWidth maxWidth="md">
      <DialogTitle>Etiquetas ({pecas.length})</DialogTitle>
      <DialogContent dividers>
        <Box
          id="area-etiquetas"
          sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
        >
          {pecas.map((p) => (
            <Box
              key={p.id}
              className="etiqueta"
              sx={{ border: "1px dashed #999", borderRadius: 1, p: 1, textAlign: "center", bgcolor: "#fff", color: "#000" }}
            >
              {qrs[p.id] && <img src={qrs[p.id]} alt={`QR code da peça ${p.codigo}`} width={110} height={110} />}
              <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>{p.codigo}</Typography>
              <Typography variant="body2" noWrap>{p.titulo}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{brl(p.preco)} · Tam. {p.tamanho}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Fechar</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Imprimir
        </Button>
      </DialogActions>
      {/* Na impressão, só as etiquetas aparecem */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #area-etiquetas, #area-etiquetas * { visibility: visible !important; }
          #area-etiquetas { position: fixed; inset: 0; display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 4mm; padding: 6mm; }
          .etiqueta { break-inside: avoid; }
        }
      `}</style>
    </Dialog>
  );
}
