import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            serviceOrders: true,
            diagnostics: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(tenantId: string, creatorRole: string, data: CreateUserDto) {
    // Verificar se o criador pode criar usuários com este role
    if (creatorRole !== 'OWNER' && data.role === 'OWNER') {
      throw new ForbiddenException('Apenas donos podem criar outros donos');
    }

    if (creatorRole === 'MECHANIC' || creatorRole === 'RECEPTIONIST') {
      throw new ForbiddenException('Você não tem permissão para criar usuários');
    }

    // Verificar se email já existe no tenant
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado nesta oficina');
    }

    // Verificar limite de usuários do plano
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true },
    });

    if (!tenant) {
      throw new NotFoundException('Oficina não encontrada');
    }

    const currentUsers = await this.prisma.user.count({
      where: { tenantId, isActive: true, deletedAt: null },
    });

    if (currentUsers >= tenant.maxUsers) {
      throw new ForbiddenException(
        `Limite de ${tenant.maxUsers} usuários atingido. Faça upgrade do plano.`,
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        tenantId,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role || 'MECHANIC',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(tenantId: string, id: string, data: UpdateUserDto) {
    await this.findById(tenantId, id);

    // Se estiver atualizando o email, verificar se já existe
    if (data.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          tenantId,
          email: data.email,
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email já cadastrado nesta oficina');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(tenantId: string, userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async delete(tenantId: string, id: string, deleterId: string) {
    const user = await this.findById(tenantId, id);

    // Não permitir excluir a si mesmo
    if (id === deleterId) {
      throw new ForbiddenException('Você não pode excluir sua própria conta');
    }

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            tradeName: true,
            logo: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
