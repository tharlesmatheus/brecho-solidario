import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function NaoEncontrado() {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h4" component="h1" gutterBottom>Página não encontrada</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>O endereço pode ter mudado ou a peça já foi vendida.</Typography>
      <Button href="/" variant="contained">Voltar para a vitrine</Button>
    </Container>
  );
}
