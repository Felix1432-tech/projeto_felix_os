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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicle.dto';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os veículos' })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada' })
  async findAll(@Request() req, @Query() query: VehicleQueryDto) {
    return this.vehiclesService.findAll(req.user.tenantId, query);
  }

  @Get('plate/:plate')
  @ApiOperation({ summary: 'Buscar veículo por placa' })
  @ApiParam({ name: 'plate', example: 'ABC-1234' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado' })
  async findByPlate(@Request() req, @Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(req.user.tenantId, plate.toUpperCase());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.findById(req.user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo veículo' })
  @ApiResponse({ status: 201, description: 'Veículo criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Request() req, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(req.user.tenantId, {
      ...createVehicleDto,
      plate: createVehicleDto.plate.toUpperCase().replace('-', ''),
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    const data = { ...updateVehicleDto };
    if (data.plate) {
      data.plate = data.plate.toUpperCase().replace('-', '');
    }
    return this.vehiclesService.update(req.user.tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir veículo (soft delete)' })
  @ApiResponse({ status: 200, description: 'Veículo excluído' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async delete(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.delete(req.user.tenantId, id);
  }
}
