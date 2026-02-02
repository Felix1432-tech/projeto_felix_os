# 🚀 Deploy no Coolify (Hostinger VPS)

## Pré-requisitos
- VPS Hostinger com Coolify instalado
- Repositório Git (GitHub, GitLab, etc.)

---

## 📦 Passo 1: Criar o Banco de Dados

1. No Coolify, vá em **Resources** → **+ New**
2. Selecione **Database** → **PostgreSQL**
3. Configure:
   - Name: `felixos-db`
   - Version: `15`
4. Clique em **Deploy**
5. Anote a **Connection String** gerada (vamos usar depois)

---

## 🔧 Passo 2: Deploy da API (Backend)

1. No Coolify, vá em **Resources** → **+ New**
2. Selecione **Application** → **Docker**
3. Conecte seu repositório Git
4. Configure:
   - **Name**: `felixos-api`
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `./Dockerfile`
   - **Port**: `3000`

5. Em **Environment Variables**, adicione:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:SENHA@felixos-db:5432/postgres
JWT_SECRET=sua-chave-super-secreta-mudar-isso-123
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-sua-chave-openai (opcional)
```

6. Clique em **Deploy**

---

## 🌐 Passo 3: Deploy do Frontend

1. No Coolify, vá em **Resources** → **+ New**
2. Selecione **Application** → **Docker**
3. Conecte o mesmo repositório Git
4. Configure:
   - **Name**: `felixos-web`
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `./apps/web/Dockerfile`
   - **Base Directory**: `./apps/web`
   - **Port**: `3000`

5. Em **Build Arguments**, adicione:

```
NEXT_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

6. Clique em **Deploy**

---

## 🔗 Passo 4: Configurar Domínios

No Coolify, para cada aplicação:

1. Vá em **Settings** → **Domains**
2. Adicione:
   - API: `api.seudominio.com`
   - Frontend: `app.seudominio.com` ou `seudominio.com`
3. Ative **SSL/HTTPS** (Let's Encrypt automático)

---

## ✅ Pronto!

Acesse:
- **Frontend**: https://app.seudominio.com
- **API Docs**: https://api.seudominio.com/api/docs

### Credenciais de teste:
```
Email: admin@demo.com
Senha: demo123
```

---

## 🔄 Atualizações

O Coolify faz deploy automático a cada push no Git!

---

## 🆘 Troubleshooting

### Erro de conexão com banco:
- Verifique se o nome do container do PostgreSQL está correto na DATABASE_URL
- No Coolify, o nome do serviço é usado como hostname

### Erro de build:
- Verifique os logs em **Deployments**
- Confirme que o Dockerfile está no caminho correto

### API não responde:
- Verifique se a porta 3000 está exposta
- Confira os logs da aplicação
