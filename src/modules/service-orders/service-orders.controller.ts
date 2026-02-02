import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ServiceOrdersService } from './service-orders.service';
import {
  CreateServiceOrderDto,
  UpdateServiceOrderDto,
  UpdateStatusDto,
  AddItemDto,
  ServiceOrderQueryDto,
} from './dto/service-order.dto';

@ApiTags('service-orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as ordens de serviço' })
  @ApiResponse({ status: 200, description: 'Lista de OS retornada' })
  async findAll(@Request() req, @Query() query: ServiceOrderQueryDto) {
    return this.serviceOrdersService.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar OS por ID' })
  @ApiResponse({ status: 200, description: 'OS encontrada' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async findById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceOrdersService.findById(req.user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  @ApiResponse({ status: 201, description: 'OS criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Request() req, @Body() createOsDto: CreateServiceOrderDto) {
    return this.serviceOrdersService.create(req.user.tenantId, req.user.sub, createOsDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar ordem de serviço' })
  @ApiResponse({ status: 200, description: 'OS atualizada' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOsDto: UpdateServiceOrderDto,
  ) {
    return this.serviceOrdersService.update(req.user.tenantId, id, updateOsDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status da OS' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async updateStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.serviceOrdersService.updateStatus(req.user.tenantId, id, updateStatusDto.status);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Adicionar item (peça ou serviço) à OS' })
  @ApiResponse({ status: 201, description: 'Item adicionado' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async addItem(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addItemDto: AddItemDto,
  ) {
    return this.serviceOrdersService.addItem(req.user.tenantId, id, addItemDto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remover item da OS' })
  @ApiResponse({ status: 200, description: 'Item removido' })
  @ApiResponse({ status: 404, description: 'OS ou item não encontrado' })
  async removeItem(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.serviceOrdersService.removeItem(req.user.tenantId, id, itemId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir OS (soft delete)' })
  @ApiResponse({ status: 200, description: 'OS excluída' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async delete(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceOrdersService.delete(req.user.tenantId, id);
  }
}
