import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query?: { search?: string; customerId?: string }) {
    return this.prisma.vehicle.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
        ...(query?.customerId && { customerId: query.customerId }),
        ...(query?.search && {
          OR: [
            { plate: { contains: query.search, mode: 'insensitive' } },
            { brand: { contains: query.search, mode: 'insensitive' } },
            { model: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        _count: { select: { serviceOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, tenantId, isActive: true, deletedAt: null },
      include: {
        customer: true,
        serviceOrders: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return vehicle;
  }

  async findByPlate(tenantId: string, plate: string) {
    return this.prisma.vehicle.findFirst({
      where: { 
        tenantId, 
        plate: { equals: plate, mode: 'insensitive' },
        isActive: true, 
        deletedAt: null 
      },
      include: { customer: true },
    });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.vehicle.create({
      data: { ...data, tenantId },
      include: { customer: true },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findById(tenantId, id);
    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { customer: true },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
