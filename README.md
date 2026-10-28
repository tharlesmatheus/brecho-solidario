# Brechó Solidário

Sistema web colaborativo de **estoque, vendas e vitrine online** para o brechó da igreja.
Atividade de extensão: *Solução colaborativa em um cenário de moda sustentável - brechó* (ODS 12).

- **Front-end:** Next.js 15 (App Router) + React 19 + MUI 7 (tema inspirado no Material Design 3)
- **Back-end:** Supabase (PostgreSQL, Auth, Storage, Realtime), com as regras de segurança no próprio banco (Row Level Security)
- **Hospedagem:** Vercel (plano Hobby, grátis) + Supabase (plano Free, grátis)

---

## 1. Colocar no ar (cerca de 20 minutos)

### 1.1 Supabase (banco de dados)
1. Crie uma conta em https://supabase.com e um projeto novo (região **South America (São Paulo)**). Anote a senha do banco.
2. Menu **SQL Editor > New query**: cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**. O arquivo pode ser rodado de novo depois, sem perder dados.
3. Menu **Project Settings > API**: copie a **Project URL** e a chave **anon public**.
4. Menu **Authentication > URL Configuration**: em **Site URL**, coloque o endereço da Vercel (passo 1.3). Em **Redirect URLs**, adicione `https://SEU-SITE.vercel.app/**`.
5. *(Opcional)* Em **Authentication > Sign In / Providers > Email**, desligue "Confirm email" se não quiser exigir confirmação por e-mail. O plano grátis tem limite baixo de e-mails por hora.

### 1.2 GitHub
1. Crie um repositório (pode ser privado) e envie esta pasta (o `.gitignore` já impede o envio de `node_modules` e `.env.local`).

### 1.3 Vercel (site)
1. Em https://vercel.com, clique em **Add New > Project** e importe o repositório.
2. Em **Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon public |
| `NEXT_PUBLIC_WHATSAPP` | WhatsApp do brechó, só números com 55 + DDD (ex.: `5577999990000`) |
| `NEXT_PUBLIC_NOME_BRECHO` | nome que aparece no topo |

3. Clique em **Deploy**.

### 1.4 Primeiro acesso
1. Abra `https://SEU-SITE.vercel.app/login` e escolha **Criar conta**. **A primeira conta criada vira coordenação (admin)** automaticamente.
2. As próximas pessoas criam conta e ficam "pendentes" até a coordenação liberar em **Voluntários**.

### Rodar no seu computador (opcional)
```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev                  # http://localhost:3000
```

---

## 2. Funcionalidades

| Área | Tela | O que faz |
|---|---|---|
| Pública | Vitrine (`/`) | Peças à venda com foto, busca, filtros (categoria, tamanho, gênero) e ordenação. Mostra números de impacto (peças reaproveitadas). |
| Pública | Peça (`/peca/[id]`) | Detalhes, **reserva online** para retirar no brechó e botão de WhatsApp |
| Pública | Moda circular (`/sobre`) | Conscientização sobre moda circular e como doar |
| Pública | Avaliar (`/avaliar`) | Questionário de usabilidade **SUS** anônimo (nota de 0 a 100) |
| Equipe | Início | Resumo do dia, **feed de atividades em tempo real**, minhas tarefas, últimos avisos |
| Equipe | Caixa / Vendas | Venda pelo código da etiqueta, desconto, forma de pagamento, caixa do dia, cancelamento (admin) |
| Equipe | Estoque | Cadastro com foto pelo celular (comprimida), status da peça, etiquetas com QR code para imprimir |
| Equipe | Doações | Lotes recebidos e progresso do cadastro das peças de cada lote |
| Equipe | Reservas | Reservas da vitrine, aviso ao cliente por WhatsApp, cancelamento |
| Equipe | Mural de avisos | Recados para a equipe, em tempo real |
| Equipe | Tarefas e escala | Quadro A fazer / Fazendo / Feito com responsável e data |
| Equipe | Relatórios | Vendido no período, ticket médio, por categoria e forma de pagamento, peças paradas há mais de 30 dias, nota SUS, exportação CSV |
| Equipe | Voluntários (admin) | Aprovar cadastros e definir papéis |
| Equipe | Como usar | Ajuda com as dúvidas mais comuns |

**Ciclo da peça:** `triagem → disponível (à venda) → reservada → vendida`, ou `repassada` quando é doada adiante.

---

## 3. Modelo 3C de Colaboração (para o relatório)

| Dimensão | Onde está no sistema |
|---|---|
| **Comunicação** | Mural de avisos (tempo real); reserva e contato por WhatsApp entre cliente e brechó |
| **Coordenação** | Papéis e permissões (coordenação / voluntário / pendente); quadro de tarefas com responsável e prazo; ciclo de status da peça; cancelamento restrito à coordenação |
| **Cooperação** | Estoque compartilhado: um voluntário registra a doação, outro fotografa, outro precifica, outro vende; doadores e clientes participam pela vitrine |
| **Percepção** | Feed "O que está acontecendo" atualizado em tempo real (quem cadastrou, vendeu, concluiu tarefa); progresso de cada lote de doação; contadores do início; avisos de tarefa atrasada e reserva antiga |

## 4. Heurísticas de Nielsen

| # | Heurística | Aplicação |
|---|---|---|
| 1 | Visibilidade do status do sistema | Mensagens de "salvo", "Reservando…", barras de progresso, chips de status da peça, contadores |
| 2 | Correspondência com o mundo real | Vocabulário do brechó: peça, doação, caixa, etiqueta, triagem |
| 3 | Controle e liberdade do usuário | Cancelar em todo diálogo, cancelar venda e reserva, voltar tarefa de coluna, tirar peça do carrinho |
| 4 | Consistência e padrões | Mesmo cabeçalho e componentes do Material Design em todas as telas |
| 5 | Prevenção de erros | Confirmação antes de excluir ou cancelar; o banco impede vender duas vezes a mesma peça; preço obrigatório para pôr à venda; desconto não pode passar do total |
| 6 | Reconhecer em vez de lembrar | Listas de categoria e tamanho, modelos de tarefa em um clique, fotos nas listas |
| 7 | Flexibilidade e eficiência | Enter no caixa, código curto ("12" = P00012), "Salvar e cadastrar outra", etiquetas em lote, câmera direto no cadastro |
| 8 | Estética e design minimalista | Uma ação principal por tela e telas enxutas |
| 9 | Ajudar a reconhecer e corrigir erros | Mensagens em português dizendo o que fazer ("Confira o código na etiqueta") |
| 10 | Ajuda e documentação | Tela "Como usar" e textos de apoio nos campos |

**Acessibilidade:** `lang="pt-BR"`, rótulos em todos os campos e botões de ícone, texto alternativo nas fotos, `aria-live` nos resultados e no feed, navegação por teclado, contraste do tema, layout responsivo (pensado primeiro para o celular) e modo escuro automático.

## 5. Segurança e custos
- Toda regra de acesso fica no banco (RLS). Visitantes só leem peças **à venda** e só conseguem reservar e avaliar pelas funções `reservar_peca` e `enviar_avaliacao`.
- Vendas e cancelamentos são **atômicos** (função `registrar_venda` com `FOR UPDATE`): ou todas as peças são vendidas, ou nenhuma.
- As fotos são reduzidas para cerca de 200 KB no próprio celular, para caber no armazenamento de 1 GB do plano grátis do Supabase.
- **Atenção:** projetos grátis do Supabase são pausados após cerca de 1 semana sem uso. Basta reativar no painel do Supabase. Confira os limites atuais em supabase.com/pricing.
- Faça backup de vez em quando: **Database > Backups** ou exportando as tabelas em CSV.

## 6. Estrutura
```
supabase/schema.sql        banco: tabelas, RLS, funções, gatilhos, storage
src/lib/                   cliente Supabase, tipos/formatos, compressão de imagem
src/components/            tema M3 + avisos, cabeçalhos, diálogo de peça, etiquetas
src/app/                   páginas públicas (vitrine, peça, sobre, avaliar, login)
src/app/painel/            área da equipe
```
