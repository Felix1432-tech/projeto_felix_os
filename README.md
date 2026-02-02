# 🔧 Felix OS - Sistema de Gestão para Oficinas Mecânicas

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" />
</p>

## 📋 Sobre

O **Felix OS** é um sistema SaaS multi-tenant para gestão de oficinas mecânicas, com foco em **Zero Typing** - onde o mecânico pode fazer tudo usando apenas VOZ e CÂMERA, sem precisar digitar.

### Principais Funcionalidades

- 📷 **OCR de Placas** - Cadastro automático de veículos por foto
- 🎤 **Diagnóstico por Voz** - Mecânico fala, sistema transcreve e extrai peças
- 💰 **Cotação Automática** - Busca preços em fornecedores automaticamente
- 📱 **WhatsApp Integrado** - Envio de orçamentos e aprovação pelo cliente
- 📊 **Dashboard em Tempo Real** - Visão completa da oficina

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (ou use o Docker)

### 1. Clone o projeto

```bash
git clone https://github.com/seu-usuario/felix-os.git
cd felix-os
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Inicie os serviços com Docker

```bash
docker-compose up -d
```

### 4. Ou rode localmente

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run db:generate

# Aplicar migrations
npm run db:push

# Iniciar em modo desenvolvimento
npm run start:dev
```

### 5. Acesse a API

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

---

## 📁 Estrutura do Projeto

```
felix-os/
├── .claude/
│   └── CLAUDE.md              # Instruções para Claude Code
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── config/                # Configurações (Prisma, etc)
│   ├── modules/
│   │   ├── auth/              # Autenticação JWT
│   │   ├── tenants/           # Gestão de oficinas
│   │   ├── users/             # Usuários
│   │   ├── customers/         # Clientes
│   │   ├── vehicles/          # Veículos
│   │   └── service-orders/    # Ordens de Serviço
│   ├── common/                # Guards, decorators, pipes
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 🔐 Autenticação

### Registrar nova oficina

```bash
POST /api/v1/auth/register
{
  "tenantName": "Auto Center Silva",
  "cnpj": "12.345.678/0001-90",
  "phone": "(11) 99999-9999",
  "userName": "João Silva",
  "email": "joao@autocenter.com",
  "password": "senha123"
}
```

### Login

```bash
POST /api/v1/auth/login
{
  "email": "joao@autocenter.com",
  "password": "senha123"
}
```

---

## 📊 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Registrar oficina |
| POST | `/auth/login` | Login |
| GET | `/tenants/me` | Dados da oficina |
| GET | `/customers` | Listar clientes |
| POST | `/customers` | Criar cliente |
| GET | `/vehicles` | Listar veículos |
| GET | `/vehicles/plate/:plate` | Buscar por placa |
| POST | `/vehicles` | Criar veículo |
| GET | `/service-orders` | Listar OS |
| POST | `/service-orders` | Criar OS |
| PATCH | `/service-orders/:id/status` | Atualizar status |
| POST | `/service-orders/:id/items` | Adicionar item |

---

## 🐳 Deploy com Coolify

1. Conecte seu repositório GitHub no Coolify
2. Configure as variáveis de ambiente
3. O build é automático via Dockerfile
4. Configure o domínio desejado

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev          # Inicia com hot-reload

# Database
npm run db:generate        # Gera cliente Prisma
npm run db:push            # Push schema para DB
npm run db:migrate         # Executa migrations
npm run db:studio          # Abre Prisma Studio

# Build
npm run build              # Build para produção
npm run start:prod         # Inicia em produção

# Docker
docker-compose up -d       # Sobe todos os serviços
docker-compose down        # Para todos os serviços
docker-compose logs -f api # Ver logs da API
```

---

## 📄 Licença

MIT License - Felix Garage © 2026
