# TrainManager Pro - Sistema de Gestão de Treinamentos

Sistema web completo para gestão de treinamentos corporativos com autenticação personalizada, integração com Stripe para pagamentos e alertas automatizados por email.

## 🚀 Funcionalidades

### Autenticação
- **Login/Cadastro tradicional** com email e senha
- **Google OAuth 2.0** para login social
- **JWT** para gerenciamento de sessões
- **Chave de acesso única** para cada usuário

### Gestão de Treinamentos
- Cadastro e gestão de funcionários
- Registro de treinamentos com datas de validade
- Dashboard com estatísticas e métricas
- Sistema de alertas automáticos (5 dias e expiração)

### Pagamentos (Stripe)
- **Checkout integrado** com assinatura mensal (R$ 100/mês)
- **7 dias de trial gratuito**
- **Portal do cliente** para gerenciar assinatura
- **Webhooks** para sincronização automática
- Controle de acesso baseado no status da assinatura

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **PostgreSQL** com **Drizzle ORM**
- **JWT** para autenticação
- **Google OAuth 2.0**
- **Stripe** para pagamentos
- **SendGrid** para emails (opcional)

### Frontend
- **React** + **TypeScript** + **Vite**
- **TailwindCSS** + **shadcn/ui**
- **TanStack Query** para estado do servidor
- **React Hook Form** + **Zod** para formulários
- **Wouter** para roteamento

## 📋 Configuração

### Variáveis de Ambiente Necessárias

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/trainmanager

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google OAuth (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Stripe (https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key

# SendGrid (Opcional - https://app.sendgrid.com)
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Ambiente
NODE_ENV=development
PORT=5000
```

### Como obter as chaves:

#### 1. Google OAuth
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Habilite a Google+ API
4. Vá para "Credenciais" > "Criar Credenciais" > "ID do cliente OAuth 2.0"
5. Configure as URLs autorizadas:
   - Origens JavaScript: `http://localhost:5000`
   - URIs de redirecionamento: `http://localhost:5000/api/auth/google/callback`

#### 2. Stripe
1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Crie uma conta ou faça login
3. Vá para "Developers" > "API Keys"
4. Copie a **Publishable key** (pk_test_...) para `VITE_STRIPE_PUBLIC_KEY`
5. Copie a **Secret key** (sk_test_...) para `STRIPE_SECRET_KEY`
6. Para webhooks:
   - Vá para "Developers" > "Webhooks"
   - Adicione endpoint: `http://localhost:5000/api/stripe/webhook`
   - Selecione eventos: `customer.subscription.*`, `invoice.payment_*`
   - Copie o **Signing secret** para `STRIPE_WEBHOOK_SECRET`

## 🚀 Instalação e Execução

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npm run db:push

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro com email/senha
- `POST /api/auth/login` - Login com email/senha
- `GET /api/auth/google` - Iniciar Google OAuth
- `GET /api/auth/google/callback` - Callback do Google
- `GET /api/auth/user` - Dados do usuário logado
- `POST /api/auth/logout` - Logout

### Stripe/Pagamentos
- `POST /api/stripe/create-checkout-session` - Criar sessão de checkout
- `POST /api/stripe/create-portal-session` - Portal do cliente
- `GET /api/stripe/subscription-status` - Status da assinatura
- `POST /api/stripe/webhook` - Webhooks do Stripe

### Funcionários
- `GET /api/employees` - Listar funcionários
- `POST /api/employees` - Criar funcionário
- `GET /api/employees/:id` - Buscar funcionário
- `PUT /api/employees/:id` - Atualizar funcionário
- `DELETE /api/employees/:id` - Deletar funcionário

### Treinamentos
- `GET /api/trainings` - Listar treinamentos
- `POST /api/trainings` - Criar treinamento
- `GET /api/trainings/:id` - Buscar treinamento
- `PUT /api/trainings/:id` - Atualizar treinamento
- `DELETE /api/trainings/:id` - Deletar treinamento
- `GET /api/trainings/employee/:employeeId` - Treinamentos por funcionário

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas do dashboard

## 🔒 Segurança

- **JWT** com expiração de 7 dias
- **Bcrypt** para hash de senhas (12 rounds)
- **Validação de entrada** com Zod
- **CORS** configurado para produção
- **Rate limiting** recomendado para produção
- **HTTPS** obrigatório em produção

## 🏗️ Estrutura do Projeto

```
├── server/
│   ├── controllers/         # Controladores da API
│   │   ├── authController.ts
│   │   └── stripeController.ts
│   ├── middleware/          # Middlewares
│   │   └── auth.ts
│   ├── routes.ts           # Definição das rotas
│   ├── storage.ts          # Camada de dados
│   ├── db.ts              # Configuração do banco
│   └── index.ts           # Servidor principal
├── client/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Páginas da aplicação
│   │   └── lib/           # Utilities
├── shared/
│   └── schema.ts          # Schemas compartilhados
└── README.md
```

## 🎯 Fluxos Principais

### Fluxo de Cadastro
1. Usuário preenche formulário
2. Sistema valida dados
3. Senha é hasheada com bcrypt
4. Chave de acesso única é gerada
5. Trial de 7 dias é ativado
6. JWT é retornado

### Fluxo de Pagamento
1. Usuário clica em "Assinar"
2. Sistema cria sessão no Stripe
3. Usuário completa pagamento
4. Webhook atualiza status da assinatura
5. Acesso completo é liberado

### Fluxo de Alertas
1. Cron job diário verifica vencimentos
2. Identifica treinamentos próximos ao vencimento (5 dias)
3. Envia emails via SendGrid
4. Registra alertas enviados

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco de dados**
   - Verifique se PostgreSQL está rodando
   - Confirme a DATABASE_URL

2. **Google OAuth não funciona**
   - Verifique GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
   - Confirme URLs de redirecionamento no Google Console

3. **Stripe não processa pagamentos**
   - Use chaves de teste (pk_test_, sk_test_)
   - Verifique webhook endpoint

4. **Emails não são enviados**
   - SENDGRID_API_KEY é opcional
   - Sistema funciona sem alertas por email

## 📝 Licença

MIT License - Veja arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request