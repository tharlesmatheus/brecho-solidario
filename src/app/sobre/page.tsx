import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import TopoPublico from "@/components/TopoPublico";

export const metadata = { title: "Moda circular" };

const PILARES = [
  {
    titulo: "Reaproveitar",
    texto:
      "A peça já foi produzida. Comprar de segunda mão evita fabricar uma nova e economiza água, energia e matéria-prima.",
  },
  {
    titulo: "Consumir com consciência",
    texto:
      "Moda rápida (fast fashion) incentiva compras por impulso e muitas vezes depende de trabalho precário. O brechó é o caminho contrário: comprar com calma, o que se precisa.",
  },
  {
    titulo: "Colaborar",
    texto:
      "Quem doa, quem revisa, quem precifica, quem vende e quem compra fazem parte da mesma corrente. O sistema existe para que essa colaboração fique organizada.",
  },
];

export default function Sobre() {
  return (
    <>
      <TopoPublico />
      <Container maxWidth="md" component="main" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          O que é moda circular
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Moda circular é manter as roupas em uso pelo maior tempo possível: doar o que não se usa, reformar,
          comprar de segunda mão. Este brechó faz parte do objetivo 12 da ONU — Consumo e Produção
          Responsáveis.
        </Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, mb: 4 }}>
          {PILARES.map((p) => (
            <Card key={p.titulo}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {p.titulo}
                </Typography>
                <Typography variant="body2">{p.texto}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Typography variant="h5" component="h2" gutterBottom>
          Como doar
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Traga roupas limpas e em bom estado ao brechó no horário de funcionamento. Os voluntários registram a
          doação, fazem a triagem e colocam as peças à venda. O valor arrecadado apoia a obra social.
        </Typography>

        <Typography variant="h5" component="h2" gutterBottom>
          Sobre este sistema
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Sistema desenvolvido como atividade de extensão universitária (&quot;Solução colaborativa em um cenário de
          moda sustentável – brechó&quot;), construído junto com os voluntários a partir de oficinas de Design
          Thinking e oferecido gratuitamente ao brechó.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button href="/" variant="contained">
            Ver a vitrine
          </Button>
          <Button href="/avaliar" variant="outlined">
            Avaliar o sistema
          </Button>
        </Box>
      </Container>
    </>
  );
}
