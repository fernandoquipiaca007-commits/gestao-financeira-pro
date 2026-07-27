# Gestão Digital Pro - Sistema de Gestão Financeira, Projetos e Agenda Multi-Moeda

Sistema completo e pronto para produção de Gestão Financeira, Controle de Projetos, Relatórios Operacionais e Agenda/Calendário Multi-Moeda com Notificações Web Push e Backend PostgreSQL no Supabase.

---

## 🚀 Principais Funcionalidades

- **🔐 Autenticação & Segurança Completa:**
  - Login seguro, cadastro de usuários e sessão persistente via Supabase Auth (JWT).
  - Proteção de rotas privadas: acesso restrito a usuários autenticados.
  - Botão de Logout rápido e modo de acesso demonstrativo instantâneo.

- **📊 Dashboard & Métricas em Tempo Real:**
  - Cálculo automático de Receita Total, Receita Mensal, Total Recebido, Total Pendente, Lucro Líquido e Despesas.
  - Indicadores dinâmicos de Clientes Ativos, Projetos em Andamento, Concluídos e Pagamentos Atrasados.
  - Gráficos visuais interativos construídos com dados reais do banco.

- **📅 Agenda & Calendário Funcional:**
  - Visão mensal interativa com marcadores de dia e agenda diária.
  - Cadastro de Eventos: Cobranças, Datas de Pagamento, Entregas de Projeto, Compromissos e Alarmes.
  - Sincronização automática com vencimentos de projetos, despesas e receitas.

- **🔔 Notificações Web Push Nativas:**
  - Integração com Service Worker (`sw.js`) para alertas do navegador.
  - Envio de notificações de lembrete em segundo plano mesmo com o navegador minimizado.

- **💱 Sistema Multi-Moeda & Câmbio Automático:**
  - Suporte nativo para **Brasil (BRL / R$)**, **Angola (AOA / Kz)**, **Estados Unidos (USD / US$)** e **Portugal/UE (EUR / €)**.
  - Integração com API gratuita de câmbio em tempo real para conversões automáticas.
  - Filtro global de moeda e consolidação financeira nos relatórios.

- **📁 CRUD Completo em 8 Entidades:**
  - Clientes (com país, moeda e contato de WhatsApp direto).
  - Projetos (com categorias, controle de parcelas e status).
  - Receitas / Entradas (com método de pagamento e controle de atrasos).
  - Despesas / Saídas (com categorização de hospedagem, domínio, ferramentas, etc.).
  - Categorias personalizadas.
  - Agenda & Eventos.
  - Notificações de Alerta.
  - Configurações da Empresa & Cotações.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS v4, Lucide React icons, Recharts.
- **Backend & Banco de Dados:** Supabase (PostgreSQL, Supabase Auth, RLS Policies).
- **Notificações:** Service Worker API, Web Notifications API.
- **Câmbio:** ExchangeRate API.

---

## ⚙️ Instalação e Execução Local

### 1. Clonar o Repositório
```bash
git clone <URL_DO_REPOSITORIO_GITHUB>
cd gestao
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um ficheiro `.env` na raiz do projeto (ou copie do `.env.example`):
```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_EXCHANGE_API_URL=https://open.er-api.com/v6/latest/USD
```

### 4. Configurar Banco de Dados no Supabase
Execute o script SQL contido no ficheiro `supabase_schema.sql` diretamente no **SQL Editor** do seu painel Supabase para criar todas as tabelas e índices necessários.

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse o sistema localmente no navegador através do endereço `http://localhost:3000`.

---

## 📦 Build para Produção

Para gerar o pacote otimizado de produção:
```bash
npm run build
```
Os ficheiros estáticos serão gerados na pasta `dist/` prontos para deploy na Vercel, Netlify ou Supabase Hosting.

---

## 📄 Licença
Este projeto é de uso exclusivo para gestão operacional e financeira comercial.
