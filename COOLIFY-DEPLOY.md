# 🚀 Deploy Felix OS no Coolify - Passo a Passo

## Método Recomendado: 3 Recursos Separados

O Coolify funciona melhor com recursos separados. Siga os 3 passos abaixo:

---

## 📦 PASSO 1: Banco de Dados (PostgreSQL)

1. No Coolify: **Resources** → **+ New** → **Docker Compose**
2. Cole este conteúdo:

```yaml
version: "3.8"

services:
  felixos-db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=felixos
      - POSTGRES_PASSWORD=FelixOS2024SecurePass!
      - POSTGRES_DB=felixos
    volumes:
      - felixos_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U felixos"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  felixos_postgres_data:
```

3. Clique **Save** e **Deploy**
4. Anote o nome do serviço: `felixos-db`

---

## 🔧 PASSO 2: API Backend (NestJS)

1. No Coolify: **Resources** → **+ New** → **Public Repository**
2. Configure:
   - **Repository**: `https://github.com/Felix1432-tech/projeto_felix_os`
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `Dockerfile`
   - **Port**: `3000`

3. Em **Environment Variables**, adicione:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://felixos:FelixOS2024SecurePass!@felixos-db:5432/felixos
JWT_SECRET=MudeEstaChaveEmProducao123456!
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

4. Em **Domains**, adicione: `api.seudominio.com`
5. Ative **HTTPS**
6. Clique **Deploy**

---

## 🌐 PASSO 3: Frontend (Next.js)

1. No Coolify: **Resources** → **+ New** → **Public Repository**
2. Configure:
   - **Repository**: `https://github.com/Felix1432-tech/projeto_felix_os`
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Base Directory**: `apps/web`
   - **Dockerfile Location**: `apps/web/Dockerfile`
   - **Port**: `3000`

3. Em **Build Arguments**, adicione:

```
NEXT_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

4. Em **Domains**, adicione: `app.seudominio.com`
5. Ative **HTTPS**
6. Clique **Deploy**

---

## ✅ Verificação Final

Após deploy, acesse:
- **Frontend**: https://app.seudominio.com
- **API Health**: https://api.seudominio.com/api/health

### Credenciais de teste:
```
Email: admin@demo.com
Senha: demo123
```

---

## 🔄 Executar Migrations (Primeira vez)

No Coolify, vá no serviço da API → **Terminal** e execute:

```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## 🆘 Problemas Comuns

### "Connection refused" no banco
- Verifique se o banco está rodando
- Confirme que o nome `felixos-db` está correto no DATABASE_URL
- Os serviços precisam estar na mesma network do Coolify

### Erro de build
- Veja os logs em **Deployments**
- Confirme que o Dockerfile está no caminho correto

### Frontend não conecta na API
- Verifique se `NEXT_PUBLIC_API_URL` tem https://
- Confirme que a API está acessível publicamente
