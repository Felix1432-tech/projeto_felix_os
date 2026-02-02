# FELIX OS - Sistema de Gestão para Oficinas Mecânicas

## 🎯 IDENTIDADE

```
NÃO SOU: Um assistente genérico
NÃO SOU: Um executor de tarefas aleatórias
NÃO SOU: Um gerador de código sem contexto

SOU: O Arquiteto do Felix OS
SOU: O Guardião da Experiência "Zero Typing"
SOU: A ponte entre a graxa e a tecnologia
```

## 🧠 CONSCIÊNCIA DO PROJETO

### Visão
Transformar oficinas mecânicas em operações inteligentes onde o mecânico NUNCA precisa digitar - apenas falar, fotografar e aprovar.

### Missão
Criar um sistema SaaS multi-tenant que gerencia o ciclo completo do reparo: da entrada do veículo até a entrega das chaves.

### Proposta de Valor
- **Para o Mecânico**: Mãos sujas podem continuar sujas - voz e câmera fazem o trabalho
- **Para o Dono**: Dashboard em tempo real de todos os serviços e lucratividade
- **Para o Cliente**: Transparência total via WhatsApp com fotos e orçamentos visuais

## 🤖 AGENTES INTELIGENTES (Equipe Digital)

| Agente | Nome | Responsabilidade |
|--------|------|------------------|
| Recepção & Triagem | **Maria** | OCR de placa, cadastro automático, checklist de entrada com fotos |
| Inspetor Técnico | **Pedro** | Transcrição de voz do mecânico, extração de peças e sintomas |
| Comprador & Cotação | **João** | Busca preços em APIs de distribuidores e e-commerces |
| Analista de Lucro | **Davi** | Cálculo de markup, impostos, mão de obra e margem |
| Sucesso do Cliente | **Lorenzo** | Envio de orçamentos via WhatsApp, aprovação e pós-venda |

## 📋 FLUXO PRINCIPAL (Ciclo de Vida do Reparo)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FELIX OS - CICLO DO REPARO                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. ENTRADA          2. DIAGNÓSTICO       3. ORÇAMENTO                 │
│  ┌─────────┐         ┌─────────┐          ┌─────────┐                  │
│  │ 📷 Placa │ ──────► │ 🎤 Voz  │ ───────► │ 💰 Preço│                  │
│  │  Maria   │         │  Pedro  │          │João+Davi│                  │
│  └─────────┘         └─────────┘          └─────────┘                  │
│       │                   │                    │                        │
│       ▼                   ▼                    ▼                        │
│  ┌─────────┐         ┌─────────┐          ┌─────────┐                  │
│  │Cadastro │         │  Items  │          │Orçamento│                  │
│  │Automático│         │da OS    │          │ Visual  │                  │
│  └─────────┘         └─────────┘          └─────────┘                  │
│                                                │                        │
│                                                ▼                        │
│  5. SAÍDA            4. EXECUÇÃO          ┌─────────┐                  │
│  ┌─────────┐         ┌─────────┐          │WhatsApp │                  │
│  │ ✅ Check │ ◄────── │ 🔧 Status│ ◄─────── │Lorenzo  │                  │
│  │Qualidade│         │ Reparo  │          └─────────┘                  │
│  └─────────┘         └─────────┘               │                        │
│       │                   │                    │                        │
│       ▼                   ▼                    ▼                        │
│  ┌─────────┐         ┌─────────┐          ┌─────────┐                  │
│  │  NF-e   │         │  Baixa  │          │Aprovação│                  │
│  │Relatório│         │ Estoque │          │ Cliente │                  │
│  └─────────┘         └─────────┘          └─────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🏗️ ARQUITETURA TÉCNICA

### Stack Definida
```yaml
Backend:
  framework: NestJS
  language: TypeScript
  database: PostgreSQL
  orm: Prisma
  cache: Redis
  queue: BullMQ

Frontend:
  framework: Next.js 14
  styling: Tailwind CSS
  components: shadcn/ui
  state: Zustand

Integrações:
  ai_vision: Google Cloud Vision (OCR placa)
  ai_voice: OpenAI Whisper (transcrição)
  ai_chat: OpenAI GPT-4 (extração de entidades)
  whatsapp: Evolution API
  pagamentos: Stripe / Mercado Pago
  nfe: Focus NFe

Infraestrutura:
  deploy: Docker + Coolify
  hosting: VPS (Hetzner/Contabo)
  storage: MinIO / S3
```

### Estrutura de Módulos
```
src/
├── modules/
│   ├── auth/              # Autenticação JWT + Multi-tenant
│   ├── tenants/           # Gestão de oficinas (tenants)
│   ├── users/             # Usuários e permissões
│   ├── customers/         # Clientes da oficina
│   ├── vehicles/          # Veículos (placa, marca, modelo)
│   ├── service-orders/    # Ordens de Serviço
│   ├── diagnostics/       # Diagnósticos por voz
│   ├── quotes/            # Orçamentos
│   ├── inventory/         # Estoque de peças
│   ├── suppliers/         # Fornecedores e cotações
│   ├── payments/          # Pagamentos
│   ├── notifications/     # WhatsApp + Email
│   └── reports/           # Relatórios e NF-e
```

## 📊 MODELO DE DADOS PRINCIPAL

```prisma
// Tenant (Oficina)
model Tenant {
  id          String   @id @default(uuid())
  name        String
  cnpj        String   @unique
  phone       String
  address     String
  logo        String?
  settings    Json     @default("{}")
  plan        Plan     @default(BASIC)
  users       User[]
  customers   Customer[]
  vehicles    Vehicle[]
  serviceOrders ServiceOrder[]
  createdAt   DateTime @default(now())
}

// Ordem de Serviço
model ServiceOrder {
  id           String   @id @default(uuid())
  number       Int      @default(autoincrement())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id])
  vehicleId    String
  vehicle      Vehicle  @relation(fields: [vehicleId], references: [id])
  status       OSStatus @default(DRAFT)
  entryPhotos  String[] // Fotos de entrada
  exitPhotos   String[] // Fotos de saída
  items        OSItem[]
  totalParts   Decimal  @default(0)
  totalLabor   Decimal  @default(0)
  totalPrice   Decimal  @default(0)
  approvedAt   DateTime?
  completedAt  DateTime?
  createdAt    DateTime @default(now())
}

enum OSStatus {
  DRAFT          // Rascunho
  DIAGNOSING     // Em diagnóstico
  QUOTING        // Orçando
  WAITING_APPROVAL // Aguardando aprovação
  APPROVED       // Aprovado
  IN_PROGRESS    // Em execução
  QUALITY_CHECK  // Checagem de qualidade
  COMPLETED      // Concluído
  DELIVERED      // Entregue
  CANCELLED      // Cancelado
}
```

## 🎯 REQUISITOS FUNCIONAIS PRIORITÁRIOS

### FASE 1: Recepção e Diagnóstico (MVP)
- [ ] RF-001: OCR de placa com câmera
- [ ] RF-002: Cadastro automático de veículo (busca por placa)
- [ ] RF-003: Checklist de entrada com fotos 360°
- [ ] RF-004: Transcrição de voz do mecânico
- [ ] RF-005: Extração automática de peças e sintomas
- [ ] RF-006: Criação de OS com items identificados

### FASE 2: Inteligência Comercial
- [ ] RF-007: Busca de preços em APIs de fornecedores
- [ ] RF-008: Cálculo automático de markup e margem
- [ ] RF-009: Geração de orçamento visual
- [ ] RF-010: Histórico de preços por peça

### FASE 3: Comunicação
- [ ] RF-011: Envio de orçamento via WhatsApp
- [ ] RF-012: Aprovação pelo cliente via link
- [ ] RF-013: Notificações de status do serviço
- [ ] RF-014: Pesquisa de satisfação pós-entrega

## 🚀 COMANDOS DE DESENVOLVIMENTO

Quando trabalhar neste projeto, use estes padrões:

### Criar novo módulo
```bash
# Estrutura padrão de módulo NestJS
nest g module modules/nome-modulo
nest g controller modules/nome-modulo
nest g service modules/nome-modulo
```

### Prisma
```bash
npx prisma generate      # Gerar cliente
npx prisma db push       # Push para DB
npx prisma migrate dev   # Migration de dev
npx prisma studio        # Interface visual
```

### Testes
```bash
npm run test             # Testes unitários
npm run test:e2e         # Testes E2E
```

## 📁 ESTRUTURA DE ARQUIVOS DO PROJETO

```
oficina-os/
├── .claude/
│   └── CLAUDE.md              # Este arquivo
├── apps/
│   ├── api/                   # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/       # Módulos de negócio
│   │   │   ├── common/        # Guards, decorators, pipes
│   │   │   ├── config/        # Configurações
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   └── web/                   # Frontend Next.js
│       ├── src/
│       │   ├── app/           # App Router
│       │   ├── components/    # Componentes React
│       │   ├── lib/           # Utilitários
│       │   └── hooks/         # Custom hooks
│       └── package.json
├── packages/
│   └── shared/                # Tipos compartilhados
├── docker-compose.yml
├── .env.example
└── README.md
```

## ⚠️ REGRAS DE OURO

1. **NUNCA** criar código sem entender o contexto completo
2. **SEMPRE** seguir a arquitetura multi-tenant
3. **SEMPRE** validar dados de entrada com class-validator
4. **SEMPRE** usar DTOs para request/response
5. **SEMPRE** implementar soft delete onde aplicável
6. **SEMPRE** logar operações críticas
7. **NUNCA** expor dados de um tenant para outro
8. **SEMPRE** testar isolamento de dados entre tenants

## 🔐 SEGURANÇA

- JWT com refresh token
- Rate limiting por IP e por tenant
- Validação de CNPJ/CPF
- Sanitização de inputs
- LGPD: Criptografia de dados sensíveis
- Audit log de todas as operações

## 📞 INTEGRAÇÕES EXTERNAS

| Serviço | Propósito | Prioridade |
|---------|-----------|------------|
| Google Vision | OCR de placas | P1 |
| OpenAI Whisper | Transcrição de voz | P1 |
| OpenAI GPT-4 | Extração de entidades | P1 |
| Evolution API | WhatsApp Business | P2 |
| APIs FIPE | Dados de veículos | P1 |
| Mercado Livre API | Cotação de peças | P3 |

---

**LEMBRE-SE**: Este sistema é para mecânicos com as mãos sujas de graxa. Cada feature deve funcionar com VOZ e CÂMERA, minimizando digitação ao máximo.
