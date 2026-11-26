# MalaCars (Athena Frotas) — Gestão inteligente de frota

Sistema SaaS multi-empresa de gestão de frota: veículos, motoristas, contratos,
financeiro e manutenções. Landing page + painel funcional.

**Stack:** React (Vite + TypeScript + Tailwind) · FastAPI (Python) · Supabase (Postgres + Auth)

## Estrutura

```
malacars/
├── db/schema.sql         → script SQL completo (projeto novo)
├── db/financeiro.sql     → migração: cobranças semanais + comprovantes
├── db/documentos.sql     → migração: documentos da frota + arquivos
├── db/conta.sql          → migração: perfil, equipe por convite e segurança
├── db/gastos.sql         → migração: gastos, gastos fixos e revisão por km
├── backend/              → API FastAPI (opcional; o painel usa Supabase direto)
└── frontend/             → app React (landing + painel)
```

## O que o painel faz

- **Visão geral:** filtro de período enxuto — atalhos de 7, 30 e 90 dias, um
  campo para digitar qualquer número de dias e a opção "Tudo", com 30 dias como
  padrão. Traz gráfico de entradas, comparação com o período anterior, ranking
  de motoristas e de veículos, e uma lista única de tudo que precisa de atenção.
  Tocar numa coluna do gráfico filtra o painel inteiro por aquela fatia. A
  janela também mostra as cobranças já agendadas à frente, já que o app gera as
  semanais com 4 semanas de antecedência; a comparação de variação usa os N dias
  imediatamente anteriores.
- **Financeiro:** o mesmo filtro de período, mais status (todas, em aberto,
  atrasadas, pagas) e um resumo de quanto cada motorista pagou e deve.
- **Contratos:** ligam veículo e motorista com valor semanal. Na criação você
  pode cadastrar o veículo e o motorista sem sair da tela.
- **Ficha individual** de cada veículo, motorista e contrato, com histórico
  financeiro, manutenções, prazos de documento e arquivos anexos.
- **Cobranças semanais** geradas automaticamente pelos contratos ativos. Ao dar
  baixa você informa o dia em que o dinheiro entrou (hoje, ontem, no vencimento
  ou uma data qualquer) — é isso que alimenta a pontualidade do motorista. A
  data pode ser corrigida depois, e cada cobrança mostra se foi paga em dia ou
  com quantos dias de atraso.
- **Foto do motorista:** avatar opcional no cadastro, visível na lista e na
  ficha, guardado no bucket privado `avatares`.
- **Gastos:** despesas avulsas (IPVA, multa, licenciamento) e gastos fixos
  mensais, como o seguro — cadastre uma vez e o app lança a parcela todo mês
  sozinho, do mesmo jeito que faz com as cobranças semanais. A tela mostra
  bruto recebido, gastos, líquido e margem, a quebra por categoria e o
  resultado por veículo. O custo das revisões vem da tela de manutenções para
  não contar duas vezes.
- **Revisão por quilometragem:** além da data agendada, a manutenção pode ser
  marcada para uma quilometragem. O alerta aparece 1.000 km antes, comparando
  com o hodômetro do veículo.
- **Arquivar ou excluir:** quando um motorista para de trabalhar (ou um carro é
  vendido), arquivar encerra o contrato, libera o veículo e tira a pessoa das
  listas e dos lembretes, mantendo o histórico financeiro. A exclusão
  permanente também existe: mostra antes o que será perdido, pede a palavra
  `EXCLUIR` e limpa comprovantes e documentos do Storage.
- **Lembretes:** mensagens prontas de WhatsApp para cobrança, manutenção e CNH.
- **Suporte:** botão flutuante no painel e um “Fale conosco” discreto no rodapé
  da landing, os dois abrindo o WhatsApp do atendimento. O número fica em
  `frontend/src/lib/support.ts` (ou na variável `VITE_SUPPORT_WHATSAPP`); sem
  número configurado, os botões não aparecem.
- **Minha conta:** foto e dados do usuário, nome da empresa, preferências
  (antecedência dos avisos, dia de recebimento padrão) e a equipe com acesso.
- **Equipe por convite:** o administrador compartilha um código e quem se
  cadastra com ele entra na mesma frota como operador, em vez de criar outra
  empresa. O código pode ser trocado a qualquer momento.
- **Segurança:** esqueci minha senha por e-mail, troca de senha com
  confirmação da senha atual, medidor de força de senha, troca de e-mail com
  dupla confirmação, verificação em duas etapas (app autenticador), encerrar
  sessão em todos os dispositivos e histórico de eventos da conta.

## 1. Configurar o Supabase

1. Crie um projeto gratuito em https://supabase.com.
2. Vá em **SQL Editor**, cole o conteúdo de `db/schema.sql` e execute.
   Isso cria todas as tabelas, os buckets do Storage, o isolamento por empresa
   (RLS) e o gatilho que cria automaticamente uma organização para cada novo
   usuário cadastrado.

   **Se o projeto já existia**, não rode o `schema.sql` de novo: aplique só as
   migrações, que podem ser executadas mais de uma vez sem risco:
   - `db/financeiro.sql` → cobranças semanais e comprovantes de pagamento
   - `db/documentos.sql` → documentação do veículo (licenciamento, IPVA,
     seguro), dados extras do motorista e arquivos anexos (CNH, CRLV,
     contrato assinado)
   - `db/conta.sql` → foto e telefone no perfil, foto do motorista,
     preferências, código de convite da equipe e histórico de eventos de
     segurança
   - `db/gastos.sql` → aba de gastos (despesas avulsas e fixas mensais) e
     revisão agendada por quilometragem

   O painel funciona sem essas migrações: os campos e as abas correspondentes
   só aparecem depois que elas rodam.
3. Em **Settings → API**, anote:
   - `Project URL` → `SUPABASE_URL`
   - `anon public key` → `SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo)
4. Em **Settings → API → JWT Settings**, anote o `JWT Secret` → `SUPABASE_JWT_SECRET`.
5. Em **Authentication → Providers**, confirme que **Email** está habilitado.
   Se quiser pular a confirmação por e-mail durante os testes, desative
   "Confirm email" em **Authentication → Settings**.
6. Em **Authentication → URL Configuration**, defina:
   - **Site URL:** `https://athena-frotas.vercel.app`
   - **Redirect URLs:**
     - `  `
     - `https://athena-frotas.vercel.app/auth/callback`
     - `https://athena-frotas.vercel.app/redefinir-senha`
     - `http://localhost:5173/**`
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/redefinir-senha`
   Sem isso, o e-mail de confirmação cai no padrão `http://localhost:3000` e o
   link falha — e o link de recuperação de senha não volta para o app.
7. **E-mail (Resend, plano grátis):** o SMTP nativo do Supabase tem limite baixo.
   - Crie conta em https://resend.com e uma API key.
   - Em **Domains**, verifique um domínio seu (Gmail não serve como remetente).
   - Em **Authentication → Emails → SMTP Settings** no Supabase:
     - Host: `smtp.resend.com`
     - Port: `465`
     - Username: `resend`
     - Password: a API key (`re_...`)
     - Sender email: `nao-responda@seudominio.com`
     - Sender name: `Athena Frotas`
   - Depois, em **Authentication → Rate Limits**, suba o limite de e-mails
     (o padrão após SMTP próprio é 30/hora).
8. **Verificação em duas etapas:** em **Authentication → Multi-Factor Auth**,
   deixe o **TOTP (App Authenticator)** habilitado. A tela de Segurança avisa
   quando o recurso está desligado no projeto.
9. **E-mail de recuperação:** em **Authentication → Emails → Reset Password**,
   o template padrão já funciona. O link expira em 1 hora e só pode ser usado
   uma vez; o app trata os dois casos com uma mensagem clara.

## 2. Rodar o backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edite o .env com os valores do Supabase (passo 1)
uvicorn app.main:app --reload --port 8000
```

A API sobe em `http://localhost:8000`. Documentação automática em
`http://localhost:8000/docs`.

## 3. Rodar o frontend (React)

```bash
cd frontend
npm install
cp .env.example .env
# edite o .env:
#   VITE_SUPABASE_URL=<mesma URL do passo 1>
#   VITE_SUPABASE_ANON_KEY=<mesma anon key do passo 1>
#   VITE_API_URL=http://localhost:8000
#   VITE_SUPPORT_WHATSAPP=5511999999999   (opcional)
#   VITE_SUPPORT_EMAIL=contato@seudominio.com  (opcional)
npm run dev
```

Acesse `http://localhost:5173`.

## 4. Primeiro acesso

1. Abra a landing page e clique em **Criar minha conta**.
2. Informe o nome da sua empresa/frota, seu nome, e-mail e senha.
3. Confirme o e-mail (se a confirmação estiver ativada) e faça login.
4. Uma organização é criada automaticamente para você — todos os dados
   ficam isolados por organização (multi-tenant), então você pode repetir
   esse processo para cada cliente/empresa que for usar o sistema.
5. Para dar acesso a um sócio ou funcionário, vá em **Minha conta → Equipe**,
   copie o código de convite e peça para a pessoa se cadastrar usando a aba
   **Tenho convite**. Ela entra na sua frota como operador.

## Deploy

- **Frontend:** `npm run build` gera a pasta `dist/` — pode ser publicada na
  Vercel, Netlify ou qualquer hospedagem estática. Configure as mesmas
  variáveis de ambiente do `.env` no painel da hospedagem.
- **Backend:** qualquer serviço que rode Python/Uvicorn (Railway, Render,
  Fly.io, um VPS com Docker). Lembre de configurar `FRONTEND_ORIGIN` com a
  URL final do frontend, para o CORS funcionar.

## Próximos passos sugeridos

- Envio automático das mensagens de WhatsApp (hoje o app abre a conversa com o
  texto pronto; automatizar exige API oficial ou um gateway como o Evolution).
- Cobranças geradas por cron no servidor, em vez de na abertura do painel.
- Papéis mais granulares: hoje `admin` gerencia empresa e equipe, e `operador`
  usa o painel; falta restringir ações específicas (por exemplo, excluir
  contratos) por papel.
- Convite por e-mail nominal, em vez de código compartilhado (exige uma função
  com `service_role` rodando no backend ou em uma Edge Function).
- Consulta de dados do veículo pela placa (Senatran / APIs pagas de FIPE).

## Autor

Gustavo Malaquias · [LinkedIn](https://www.linkedin.com/in/ghmalak) · [GitHub](https://github.com/GhMalak)
