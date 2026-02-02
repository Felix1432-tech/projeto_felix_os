import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar tenant de demonstração
  const tenant = await prisma.tenant.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      name: 'Auto Center Demo',
      tradeName: 'Demo Oficina',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 3333-4444',
      whatsapp: '(11) 99999-8888',
      email: 'demo@felixos.com.br',
      street: 'Rua das Oficinas',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      plan: 'PROFESSIONAL',
      maxUsers: 10,
      maxVehicles: 500,
      defaultMarkup: 40,
      defaultLaborRate: 180,
    },
  });

  console.log('✅ Tenant criado:', tenant.name);

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Administrador Demo',
      phone: '(11) 99999-0001',
      role: 'OWNER',
    },
  });

  console.log('✅ Usuário owner criado:', owner.email);

  // Criar mecânico
  const mechanic = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'mecanico@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'mecanico@demo.com',
      password: hashedPassword,
      name: 'João Mecânico',
      phone: '(11) 99999-0002',
      role: 'MECHANIC',
    },
  });

  console.log('✅ Usuário mecânico criado:', mechanic.email);

  // Criar clientes de demonstração
  const customer1 = await prisma.customer.upsert({
    where: { tenantId_cpfCnpj: { tenantId: tenant.id, cpfCnpj: '123.456.789-00' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Maria Silva',
      cpfCnpj: '123.456.789-00',
      email: 'maria@email.com',
      phone: '(11) 98888-1111',
      whatsapp: '(11) 98888-1111',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { tenantId_cpfCnpj: { tenantId: tenant.id, cpfCnpj: '987.654.321-00' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Carlos Santos',
      cpfCnpj: '987.654.321-00',
      email: 'carlos@email.com',
      phone: '(11) 98888-2222',
      whatsapp: '(11) 98888-2222',
      city: 'São Paulo',
      state: 'SP',
    },
  });

  console.log('✅ Clientes criados:', customer1.name, ',', customer2.name);

  // Criar veículos
  const vehicle1 = await prisma.vehicle.upsert({
    where: { tenantId_plate: { tenantId: tenant.id, plate: 'ABC1D23' } },
    update: {},
    create: {
      tenantId: tenant.id,
      customerId: customer1.id,
      plate: 'ABC1D23',
      brand: 'Volkswagen',
      model: 'Gol',
      version: '1.0 MPI',
      year: 2020,
      modelYear: 2021,
      color: 'Prata',
      fuelType: 'FLEX',
      transmission: 'MANUAL',
      engine: '1.0',
      mileage: 45000,
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { tenantId_plate: { tenantId: tenant.id, plate: 'XYZ9E87' } },
    update: {},
    create: {
      tenantId: tenant.id,
      customerId: customer1.id,
      plate: 'XYZ9E87',
      brand: 'Honda',
      model: 'Civic',
      version: 'EXL 2.0',
      year: 2022,
      modelYear: 2022,
      color: 'Preto',
      fuelType: 'FLEX',
      transmission: 'CVT',
      engine: '2.0',
      mileage: 25000,
    },
  });

  const vehicle3 = await prisma.vehicle.upsert({
    where: { tenantId_plate: { tenantId: tenant.id, plate: 'DEF5G67' } },
    update: {},
    create: {
      tenantId: tenant.id,
      customerId: customer2.id,
      plate: 'DEF5G67',
      brand: 'Fiat',
      model: 'Argo',
      version: 'Drive 1.3',
      year: 2021,
      modelYear: 2022,
      color: 'Vermelho',
      fuelType: 'FLEX',
      transmission: 'MANUAL',
      engine: '1.3',
      mileage: 35000,
    },
  });

  console.log('✅ Veículos criados:', vehicle1.plate, vehicle2.plate, vehicle3.plate);

  // Criar uma OS de exemplo
  const serviceOrder = await prisma.serviceOrder.upsert({
    where: { tenantId_number: { tenantId: tenant.id, number: 1 } },
    update: {},
    create: {
      tenantId: tenant.id,
      number: 1,
      customerId: customer1.id,
      vehicleId: vehicle1.id,
      createdById: mechanic.id,
      status: 'IN_PROGRESS',
      mileageIn: 45000,
      fuelLevel: 50,
      entryNotes: 'Cliente relata barulho na suspensão dianteira',
      startedAt: new Date(),
    },
  });

  // Adicionar itens à OS
  await prisma.oSItem.createMany({
    data: [
      {
        serviceOrderId: serviceOrder.id,
        type: 'PART',
        description: 'Amortecedor dianteiro esquerdo',
        partNumber: 'AM-VW-001',
        brand: 'Monroe',
        quantity: 1,
        unitCost: 180,
        unitPrice: 280,
        totalPrice: 280,
      },
      {
        serviceOrderId: serviceOrder.id,
        type: 'PART',
        description: 'Amortecedor dianteiro direito',
        partNumber: 'AM-VW-002',
        brand: 'Monroe',
        quantity: 1,
        unitCost: 180,
        unitPrice: 280,
        totalPrice: 280,
      },
      {
        serviceOrderId: serviceOrder.id,
        type: 'SERVICE',
        description: 'Mão de obra troca de amortecedores',
        quantity: 1,
        laborHours: 2,
        laborRate: 180,
        unitPrice: 360,
        totalPrice: 360,
      },
    ],
    skipDuplicates: true,
  });

  // Atualizar totais da OS
  await prisma.serviceOrder.update({
    where: { id: serviceOrder.id },
    data: {
      totalParts: 560,
      totalLabor: 360,
      totalPrice: 920,
    },
  });

  console.log('✅ OS criada: #', serviceOrder.number);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('   Admin: admin@demo.com / demo123');
  console.log('   Mecânico: mecanico@demo.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
