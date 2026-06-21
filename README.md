# FitAI Waitlist API

Backend minimalista para captura de leads da lista de espera do FitAI.  
Stack: Node.js · Express · Drizzle ORM · Neon PostgreSQL · TypeScript

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Health check para o Coolify |
| `POST` | `/waitlist` | Cadastra um lead na lista |
| `GET` | `/waitlist/count?secret=` | Retorna contagem total (landing page) |
| `GET` | `/admin/leads?secret=` | Exporta todos os leads em JSON |

### POST /waitlist

```json
// Body
{ "name": "João Silva", "email": "joao@email.com", "profile": "user" }

// Perfis válidos: "user" | "personal" | "gym"

// Resposta 201
{ "success": true, "position": 12 }

// Resposta 409 (e-mail duplicado)
{ "success": false, "error": "Este e-mail já está cadastrado na lista de espera." }
```

---

## Pré-requisitos

- Node.js 20+
- Conta no [Neon](https://neon.tech) (PostgreSQL gratuito)
- VPS com Coolify instalado

---

## Desenvolvimento local

```bash
# 1. Clone e instale
git clone <seu-repo>
cd fitai-waitlist-api
npm install

# 2. Configure o ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL do Neon e um ADMIN_SECRET

# 3. Rode a migration (cria a tabela no Neon)
npm run db:push

# 4. Inicie em modo dev
npm run dev
# API disponível em http://localhost:3000
```

---

## Migration com Drizzle (drizzle-kit push)

> Execute isso **antes** do primeiro deploy e sempre que alterar o schema.

```bash
# Garanta que DATABASE_URL está no .env apontando para o Neon
npm run db:push
```

O comando conecta direto no Neon e sincroniza a tabela `waitlist` sem precisar
gerar arquivos de migration. Saída esperada:

```
[✓] Changes applied:
  - Created table `waitlist`
  - Created enum `profile_type`
```

---

## Deploy no Coolify

### 1. Prepare o repositório

Faça push do projeto para um repositório Git (GitHub, GitLab, etc.):

```bash
git init
git add .
git commit -m "feat: fitai waitlist api"
git remote add origin https://github.com/SEU_USUARIO/fitai-waitlist-api.git
git push -u origin main
```

### 2. Crie a aplicação no Coolify

1. No painel Coolify → **+ New Resource** → **Application**
2. Selecione seu repositório Git
3. Em **Build Pack**, escolha **Dockerfile**
4. **Dockerfile location**: `./Dockerfile` (raiz do projeto)
5. **Port**: `3000`
6. Clique em **Save**

### 3. Configure as variáveis de ambiente no Coolify

No painel da aplicação → aba **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string completa do Neon (com `?sslmode=require`) |
| `ADMIN_SECRET` | Uma senha longa e aleatória (ex: gerada com `openssl rand -hex 32`) |
| `PORT` | `3000` |
| `CORS_ORIGIN` | URL da sua landing page (ex: `https://fitai.com.br`) |

> Onde encontrar a `DATABASE_URL` no Neon:  
> Painel Neon → seu projeto → **Connection Details** → copie a string **Connection string** (formato `postgresql://...`)

### 4. Faça o primeiro deploy

No Coolify → clique em **Deploy**. O Coolify vai:
1. Clonar o repositório
2. Executar o build multi-stage do Dockerfile
3. Subir o container na porta 3000
4. Verificar o health check em `/health`

### 5. Conecte o domínio no Coolify

1. Painel da aplicação → aba **Domains**
2. Clique em **Add Domain**
3. Digite o domínio da API (ex: `api.fitai.com.br`)
4. Marque **Generate SSL Certificate** (Let's Encrypt automático)
5. No seu DNS (Hostinger, Cloudflare, etc.), crie um registro:
   ```
   Tipo: A
   Nome: api
   Valor: IP_DO_SEU_VPS
   TTL: 300
   ```
6. Clique em **Save** — o Coolify provisiona o SSL automaticamente

### 6. Rode a migration apontando para produção

Após o deploy, rode o push do schema **localmente** com a DATABASE_URL de produção:

```bash
DATABASE_URL="postgresql://..." npm run db:push
```

Ou defina no `.env` temporariamente e execute `npm run db:push`.

---

## Exportar leads

```bash
curl "https://api.fitai.com.br/admin/leads?secret=SEU_ADMIN_SECRET" | jq .
```

---

## URLs do projeto

| Recurso | URL |
|---------|-----|
| Landing page | `https://fitai.adilsondev.com.br` |
| API backend  | `https://api.fitai.adilsondev.com.br` |
| Coolify admin | `https://coolify.adilsondev.com.br` |

## Conectar na landing page

O `index.html` já está configurado com:
```javascript
const API_BASE   = 'https://api.fitai.adilsondev.com.br';
const API_SECRET = 'TROQUE_PELO_SEU_ADMIN_SECRET';
```

Após o deploy, substitua `TROQUE_PELO_SEU_ADMIN_SECRET` pelo valor real do `ADMIN_SECRET`
que você configurou nas variáveis de ambiente do Coolify.

A variável `CORS_ORIGIN` no Coolify deve ser `https://fitai.adilsondev.com.br`.

> **Nota de segurança**: o `ADMIN_SECRET` no frontend é visível no código-fonte.
> Para o `/waitlist/count` isso é aceitável pois o endpoint só expõe uma contagem.
> Nunca exponha o secret de um endpoint que retorne dados sensíveis.
