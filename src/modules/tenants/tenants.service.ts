import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException('Oficina não encontrada');
    }

    return tenant;
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async getStats(tenantId: string) {
    const [customers, vehicles, serviceOrders, pendingOrders] =
      await Promise.all([
        this.prisma.customer.count({
          where: { tenantId, isActive: true, deletedAt: null },
        }),
        this.prisma.vehicle.count({
          where: { tenantId, isActive: true, deletedAt: null },
        }),
        this.prisma.serviceOrder.count({
          where: { tenantId, deletedAt: null },
        }),
        this.prisma.serviceOrder.count({
          where: {
            tenantId,
            deletedAt: null,
            status: { in: ['DRAFT', 'DIAGNOSING', 'QUOTING', 'WAITING_APPROVAL'] },
          },
        }),
      ]);

    return {
      customers,
      vehicles,
      serviceOrders,
      pendingOrders,
    };
  }
}
