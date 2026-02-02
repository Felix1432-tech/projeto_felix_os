import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { LoginDto, RegisterDto, RegisterTenantDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Login de usuário
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
        },
      },
    };
  }

  // Registro de nova oficina + usuário admin
  async registerTenant(dto: RegisterTenantDto) {
    // Verificar se CNPJ já existe
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { cnpj: dto.cnpj },
    });

    if (existingTenant) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Criar tenant e usuário em transação
    const result = await this.prisma.$transaction(async (prisma) => {
      // Criar tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: dto.tenantName,
          cnpj: dto.cnpj,
          phone: dto.phone,
          email: dto.email,
          street: dto.street || '',
          number: dto.number || '',
          neighborhood: dto.neighborhood || '',
          city: dto.city || '',
          state: dto.state || '',
          zipCode: dto.zipCode || '',
        },
      });

      // Criar usuário owner
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          password: hashedPassword,
          name: dto.userName,
          phone: dto.phone,
          role: 'OWNER',
        },
      });

      return { tenant, user };
    });

    // Gerar token
    const payload = {
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: result.user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
      },
    };
  }

  // Validar token
  async validateUser(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });
  }
}
