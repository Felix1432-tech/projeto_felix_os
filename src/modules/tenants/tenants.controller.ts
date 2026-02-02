import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/tenant.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter dados da oficina atual' })
  @ApiResponse({ status: 200, description: 'Dados da oficina retornados' })
  async getMyTenant(@Request() req) {
    return this.tenantsService.findById(req.user.tenantId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Obter estatísticas da oficina' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas',
    schema: {
      properties: {
        customers: { type: 'number', example: 150 },
        vehicles: { type: 'number', example: 230 },
        serviceOrders: { type: 'number', example: 1250 },
        pendingOrders: { type: 'number', example: 12 },
      },
    },
  })
  async getStats(@Request() req) {
    return this.tenantsService.getStats(req.user.tenantId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Atualizar dados da oficina' })
  @ApiResponse({ status: 200, description: 'Oficina atualizada' })
  async updateMyTenant(@Request() req, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(req.user.tenantId, updateTenantDto);
  }
}
