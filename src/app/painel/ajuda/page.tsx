import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Titulo from "@/components/Titulo";

const PERGUNTAS = [
  {
    p: "Chegou uma doação. O que faço?",
    r: "Vá em Doações > Registrar doação, informe quem doou e quantas peças vieram. Em seguida o sistema abre o cadastro das peças daquele lote — use \"Salvar e cadastrar outra\" para ir mais rápido.",
  },
  {
    p: "Como coloco uma peça na vitrine?",
    r: "Toda peça nova entra \"Em triagem\". Depois de revisar e definir o preço, toque no ícone da loja na lista do Estoque (ou mude a Situação para \"À venda\" ao editar).",
  },
  {
    p: "Como imprimo as etiquetas?",
    r: "No Estoque, marque as peças pela caixinha da esquerda e toque em \"Etiquetas\". Cada etiqueta tem o código (ex.: P00012), o preço e um QR code que abre a peça na vitrine.",
  },
  {
    p: "Como registro uma venda?",
    r: "Em Caixa / Vendas, digite o código da etiqueta (pode ser só o número, ex.: 12) e aperte Enter. Adicione todas as peças, escolha a forma de pagamento e toque em Finalizar venda.",
  },
  {
    p: "Errei uma venda. E agora?",
    r: "A coordenação pode cancelar a venda em \"Últimas vendas\". As peças voltam automaticamente para a vitrine.",
  },
  {
    p: "Alguém reservou pela internet. O que faço?",
    r: "A reserva aparece em Reservas. Toque em \"Avisar\" para mandar mensagem pelo WhatsApp. Quando a pessoa vier buscar, registre a venda no Caixa com o código da peça — a reserva é concluída sozinha.",
  },
  {
    p: "Para que serve o Mural e as Tarefas?",
    r: "O Mural é para recados para toda a equipe. Em Tarefas e escala você combina quem faz o quê e quando (triagem, fotos, plantão no caixa). Quem avança uma tarefa sem dono vira o responsável.",
  },
  {
    p: "Uma pessoa nova quer ajudar. Como dou acesso?",
    r: "Ela cria a conta em \"Área da equipe\". Depois a coordenação vai em Voluntários e muda o acesso dela para \"Voluntário\".",
  },
  {
    p: "Apareceu \"Sem conexão\". Perdi o que fiz?",
    r: "Nada é salvo sem internet. Confira o Wi-Fi ou os dados móveis e tente de novo: o que já apareceu como salvo está guardado.",
  },
];

export default function Ajuda() {
  return (
    <>
      <Titulo titulo="Como usar" subtitulo="Dúvidas mais comuns da equipe" />
      {PERGUNTAS.map((q, i) => (
        <Accordion key={i} disableGutters variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`r${i}`} id={`p${i}`}>
            <Typography>{q.p}</Typography>
          </AccordionSummary>
          <AccordionDetails id={`r${i}`}>
            <Typography color="text.secondary">{q.r}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}
