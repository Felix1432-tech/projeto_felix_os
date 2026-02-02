import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServiceOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query?: { status?: string; customerId?: string; vehicleId?: string }) {
    return this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(query?.status && { status: query.status as any }),
        ...(query?.customerId && { customerId: query.customerId }),
        ...(query?.vehicleId && { vehicleId: query.vehicleId }),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, whatsapp: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true, year: true, color: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: true,
        vehicle: true,
        createdBy: { select: { id: true, name: true } },
        items: true,
        diagnostics: true,
        payments: true,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return serviceOrder;
  }

  async create(tenantId: string, userId: string, data: any) {
    // Gerar próximo número da OS
    const lastOS = await this.prisma.serviceOrder.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const nextNumber = (lastOS?.number || 0) + 1;

    return this.prisma.serviceOrder.create({
      data: {
        tenantId,
        createdById: userId,
        number: nextNumber,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        mileageIn: data.mileageIn,
        fuelLevel: data.fuelLevel,
        entryNotes: data.entryNotes,
        entryPhotos: data.entryPhotos || [],
        status: 'DRAFT',
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findById(tenantId, id);
    return this.prisma.serviceOrder.update({
      where: { id },
      data,
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const os = await this.findById(tenantId, id);
    
    const updateData: any = { status };

    // Atualizar timestamps baseado no status
    switch (status) {
      case 'APPROVED':
        updateData.approvedAt = new Date();
        break;
      case 'IN_PROGRESS':
        updateData.startedAt = new Date();
        break;
      case 'COMPLETED':
        updateData.completedAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        break;
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async addItem(tenantId: string, osId: string, itemData: any) {
    await this.findById(tenantId, osId);

    const item = await this.prisma.oSItem.create({
      data: {
        serviceOrderId: osId,
        type: itemData.type || 'PART',
        description: itemData.description,
        partNumber: itemData.partNumber,
        brand: itemData.brand,
        quantity: itemData.quantity || 1,
        unitCost: itemData.unitCost || 0,
        unitPrice: itemData.unitPrice || 0,
        totalPrice: (itemData.quantity || 1) * (itemData.unitPrice || 0),
        laborHours: itemData.laborHours,
        laborRate: itemData.laborRate,
      },
    });

    // Recalcular totais da OS
    await this.recalculateTotals(osId);

    return item;
  }

  async removeItem(tenantId: string, osId: string, itemId: string) {
    await this.findById(tenantId, osId);
    
    await this.prisma.oSItem.delete({
      where: { id: itemId },
    });

    // Recalcular totais da OS
    await this.recalculateTotals(osId);
  }

  private async recalculateTotals(osId: string) {
    const items = await this.prisma.oSItem.findMany({
      where: { serviceOrderId: osId },
    });

    let totalParts = 0;
    let totalLabor = 0;

    for (const item of items) {
      if (item.type === 'PART') {
        totalParts += Number(item.totalPrice);
      } else {
        totalLabor += Number(item.totalPrice);
      }
    }

    await this.prisma.serviceOrder.update({
      where: { id: osId },
      data: {
        totalParts,
        totalLabor,
        totalPrice: totalParts + totalLabor,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.serviceOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
