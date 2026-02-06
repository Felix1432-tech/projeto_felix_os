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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './dto/vehicle.dto';
import { VisionService } from '../../common/services/vision.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly visionService: VisionService,
  ) {}

  @Post('ocr-plate')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Reconhecer placa de veículo via OCR (câmera)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary', description: 'Foto da placa do veículo' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Placa reconhecida com sucesso' })
  @ApiResponse({ status: 400, description: 'Imagem inválida ou placa não encontrada' })
  async recognizePlate(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'Nenhuma imagem enviada', plate: null };
    }

    const result = await this.visionService.recognizePlate(file.buffer);

    // Se reconheceu a placa, buscar se já existe no sistema
    if (result.plate) {
      // Não passamos tenantId aqui pois é uma busca global
      // O frontend decidirá se cria ou usa existente
      return {
        ...result,
        message: result.plate
          ? `Placa ${result.plate} reconhecida com ${Math.round(result.confidence * 100)}% de confiança`
          : 'Não foi possível reconhecer a placa',
      };
    }

    return {
      ...result,
      message: 'Não foi possível reconhecer a placa. Tente uma foto mais nítida.',
    };
  }

  @Post('ocr-plate-and-lookup')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Reconhecer placa e buscar veículo no sistema' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary', description: 'Foto da placa do veículo' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Placa reconhecida e veículo buscado' })
  async recognizePlateAndLookup(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { error: 'Nenhuma imagem enviada', plate: null, vehicle: null };
    }

    const ocrResult = await this.visionService.recognizePlate(file.buffer);

    if (!ocrResult.plate) {
      return {
        ...ocrResult,
        vehicle: null,
        message: 'Não foi possível reconhecer a placa. Tente uma foto mais nítida.',
      };
    }

    // Buscar veículo no sistema
    const vehicle = await this.vehiclesService.findByPlate(req.user.tenantId, ocrResult.plate);

    return {
      ...ocrResult,
      vehicle,
      isNewVehicle: !vehicle,
      message: vehicle
        ? `Veículo encontrado: ${vehicle.brand} ${vehicle.model}`
        : `Placa ${ocrResult.plate} não cadastrada. Deseja cadastrar?`,
    };
  }

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
