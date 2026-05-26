# Sistema de Fechamento Técnico Emcale

Sistema web para fechamento de chamados técnicos de telecom.
**Next.js 14 · Supabase · Google Sheets API · Vercel**

---

## Arquitetura

```
Técnico (celular/browser)
  └─ GET /api/tickets?id=XXX         → googleSheets.ts → Google Sheets API
  └─ GET /api/materials               → Supabase (materiais ativos)
  └─ GET /api/services                → Supabase (serviços ativos)
  └─ POST /api/closures               → Supabase DB + jsPDF + Supabase Storage

Administrador (browser)
  └─ /admin/login                     → Supabase Auth
  └─ /admin/*                         → middleware.ts protege via JWT
  └─ GET /api/materials?all=1         → Supabase (todos, incluindo inativos)
  └─ GET /api/services?all=1          → Supabase (todos, incluindo inativos)
  └─ GET /api/reports?format=excel    → excelGenerator.ts → .xlsx download
```

---

## Pré-requisitos

- Node.js 18+
- Conta Supabase (free tier funciona)
- Conta Google Cloud (free tier funciona)
- Conta Vercel (free tier funciona)

---

## 1. Instalação local

```bash
git clone https://github.com/seu-usuario/emcale-fechamento.git
cd emcale-fechamento
npm install
cp .env.example .env.local
# Preencha as variáveis em .env.local
npm run dev
# Abra http://localhost:3000
```

---

## 2. Configurar Supabase

### 2.1 Criar projeto

1. Acesse https://supabase.com → **New Project**
2. Defina senha do banco, região `sa-east-1` (São Paulo) se disponível

### 2.2 Executar SQL do banco

**SQL Editor → New query → cole e execute `database/schema.sql`**

### 2.3 Configurar Storage (bucket para PDFs)

**SQL Editor → New query → cole e execute `database/storage.sql`**

Ou manualmente: **Storage → New Bucket → nome: `reports` → marcar Public**

### 2.4 Criar administrador

**Authentication → Users → Invite User** → e-mail do admin → o usuário receberá link para criar senha

### 2.5 Copiar credenciais para .env.local

| Variável | Onde encontrar no Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role ⚠️ |

---

## 3. Configurar Google Sheets

### 3.1 Google Cloud Console

1. https://console.cloud.google.com → **New Project** (ex: `emcale-sistema`)
2. **APIs & Services → Library → Google Sheets API → Enable**

### 3.2 Service Account

1. **APIs & Services → Credentials → Create Credentials → Service Account**
2. Nome: `emcale-sheets` → Create and Continue → Done
3. Clique na conta → **Keys → Add Key → Create New Key → JSON**
4. Salve o arquivo JSON baixado

### 3.3 Preencher variáveis

Do arquivo JSON:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL  →  client_email
GOOGLE_PRIVATE_KEY            →  private_key  (cole com \n nas quebras)
```

### 3.4 Criar planilha de tickets

1. Crie uma planilha no Google Sheets
2. Renomeie a aba para **Tickets**
3. Linha 1 = cabeçalho (obrigatório):

| A | B | C |
|---|---|---|
| ticket_id | ticket_name | company |
| TKT-001 | Instalação João Silva | Telelink Telecom |
| TKT-002 | Reparo Maria Santos | FibraNet SP |

4. **Compartilhar** a planilha com o e-mail da Service Account → permissão **Visualizador**
5. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/`**`ID_AQUI`**`/edit`
6. Cole em `GOOGLE_SHEETS_ID=`

---

## 4. Logo

Substitua `/public/logo-emcale.png` pelo arquivo PNG real da logo.

Para incluir no PDF, descomente as linhas em `lib/pdfGenerator.ts`:

```ts
import fs from 'fs'
import path from 'path'

// Dentro de generateClosurePDF():
const logoPath   = path.join(process.cwd(), 'public', 'logo-emcale.png')
const logoBase64 = fs.readFileSync(logoPath).toString('base64')
doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 6, 40, 26)
```

---

## 5. Deploy na Vercel

```bash
# Subir no GitHub
git init
git add .
git commit -m "feat: sistema emcale v1"
git branch -M main
git remote add origin https://github.com/seu-usuario/emcale.git
git push -u origin main
```

Vercel:
1. https://vercel.com → **New Project → Import from GitHub**
2. Selecione o repositório → Framework: **Next.js**
3. **Environment Variables** → adicione as 7 variáveis do `.env.example`
4. **⚠️ GOOGLE_PRIVATE_KEY na Vercel**: cole o valor SEM aspas duplas externas, com `\n` literal para quebras de linha
5. **Deploy**

---

## 6. Variáveis obrigatórias (resumo)

| Variável | Visível no frontend | Obrigatória |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sim | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Sim | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Não | ✅ |
| `GOOGLE_SHEETS_ID` | ❌ Não | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ❌ Não | ✅ |
| `GOOGLE_PRIVATE_KEY` | ❌ Não | ✅ |
| `NEXT_PUBLIC_APP_URL` | ✅ Sim | Opcional |

---

## 7. Checklist de testes pós-deploy

### Tela do técnico (`/`)
- [ ] Buscar ticket existente → exibe ID, nome, empresa
- [ ] Buscar ticket inexistente → mensagem de erro clara
- [ ] Adicionar material → aparece com nome, unidade e quantidade
- [ ] Remover material → some da lista
- [ ] Adicionar serviço → aparece com nome e observação
- [ ] Finalizar sem nome do técnico → erro de validação
- [ ] Finalizar sem materiais/serviços → erro de validação
- [ ] Finalizar com dados válidos → tela de sucesso
- [ ] Botão "Baixar PDF" → abre PDF com cabeçalho verde
- [ ] Botão "WhatsApp" → abre WhatsApp com mensagem e link

### Área administrativa (`/admin`)
- [ ] Acessar `/admin` sem login → redireciona para `/admin/login`
- [ ] Login errado → mensagem de erro
- [ ] Login correto → acessa dashboard
- [ ] Dashboard → exibe contadores
- [ ] Materiais → lista todos (ativos e inativos)
- [ ] Materiais → criar novo → aparece na lista
- [ ] Materiais → editar → atualiza nome/unidade
- [ ] Materiais → toggle → ativa/inativa
- [ ] Serviços → idem
- [ ] Fechamentos → lista com detalhes expansíveis
- [ ] Relatórios → filtrar por data → retorna resultados
- [ ] Relatórios → filtrar por técnico → retorna resultados
- [ ] Exportar Excel → baixa arquivo `.xlsx` válido
- [ ] Logout → redireciona para login

---

## Estrutura de arquivos

```
emcale/
├── app/
│   ├── page.tsx                  # Tela do técnico (pública)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Estilos globais + design tokens
│   ├── api/
│   │   ├── tickets/route.ts      # GET ?id= → Google Sheets
│   │   ├── closures/route.ts     # POST (criar) + GET (listar)
│   │   ├── materials/route.ts    # GET / POST / PUT
│   │   ├── services/route.ts     # GET / POST / PUT
│   │   └── reports/route.ts      # GET + ?format=excel
│   └── admin/
│       ├── page.tsx              # Dashboard
│       ├── login/page.tsx        # Login Supabase Auth
│       ├── materials/page.tsx    # CRUD materiais
│       ├── services/page.tsx     # CRUD serviços
│       ├── closures/page.tsx     # Histórico
│       └── reports/page.tsx      # Relatórios + Excel
├── components/
│   └── AdminLayout.tsx           # Sidebar + top bar admin
├── lib/
│   ├── types.ts                  # Tipos TypeScript globais
│   ├── supabaseClient.ts         # Cliente browser (anon key)
│   ├── supabaseAdmin.ts          # Cliente servidor (service role)
│   ├── googleSheets.ts           # Integração Google Sheets API
│   ├── pdfGenerator.ts           # Geração PDF com jsPDF
│   ├── excelGenerator.ts         # Exportação Excel com xlsx
│   ├── whatsapp.ts               # Helper link WhatsApp
│   └── utils.ts                  # Utilitários de formatação
├── database/
│   ├── schema.sql                # Tabelas + RLS + dados iniciais
│   └── storage.sql               # Bucket reports + políticas
├── public/
│   └── logo-emcale.png           # ← adicionar aqui
├── middleware.ts                 # Proteção rotas /admin
├── .env.example                  # Template de variáveis
├── .gitignore
├── .eslintrc.json
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```
