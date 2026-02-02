import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  IsNumber,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OSStatus {
  DRAFT = 'DRAFT',
  DIAGNOSING = 'DIAGNOSING',
  QUOTING = 'QUOTING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  QUALITY_CHECK = 'QUALITY_CHECK',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ItemType {
  PART = 'PART',
  SERVICE = 'SERVICE',
}

export class CreateServiceOrderDto {
  @ApiProperty({ example: 'uuid-do-cliente' })
  @IsUUID('4', { message: 'ID do cliente inválido' })
  customerId: string;

  @ApiProperty({ example: 'uuid-do-veiculo' })
  @IsUUID('4', { message: 'ID do veículo inválido' })
  vehicleId: string;

  @ApiProperty({ example: 45000, description: 'Quilometragem na entrada', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileageIn?: number;

  @ApiProperty({ example: 75, description: 'Nível de combustível (0-100)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  fuelLevel?: number;

  @ApiProperty({ example: 'Cliente relata barulho na suspensão', required: false })
  @IsOptional()
  @IsString()
  entryNotes?: string;

  @ApiProperty({ type: [String], required: false, description: 'URLs das fotos de entrada' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entryPhotos?: string[];
}

export class UpdateServiceOrderDto {
  @ApiProperty({ example: 45100, description: 'Quilometragem na saída', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileageOut?: number;

  @ApiProperty({ example: 'Serviço concluído com sucesso', required: false })
  @IsOptional()
  @IsString()
  exitNotes?: string;

  @ApiProperty({ type: [String], required: false, description: 'URLs das fotos de saída' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exitPhotos?: string[];

  @ApiProperty({ example: 50.00, description: 'Desconto em reais', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: OSStatus, example: OSStatus.IN_PROGRESS })
  @IsEnum(OSStatus)
  status: OSStatus;
}

export class AddItemDto {
  @ApiProperty({ enum: ItemType, default: ItemType.PART })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @ApiProperty({ example: 'Amortecedor dianteiro esquerdo' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'AM-12345', required: false })
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiProperty({ example: 'Monroe', required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @ApiProperty({ example: 150.00, description: 'Custo unitário (compra)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiProperty({ example: 250.00, description: 'Preço unitário (venda)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiProperty({ example: 2.5, description: 'Horas de trabalho (para serviços)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborHours?: number;

  @ApiProperty({ example: 150.00, description: 'Valor/hora (para serviços)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborRate?: number;
}

export class ServiceOrderQueryDto {
  @ApiProperty({ enum: OSStatus, required: false, description: 'Filtrar por status' })
  @IsOptional()
  @IsEnum(OSStatus)
  status?: OSStatus;

  @ApiProperty({ required: false, description: 'Filtrar por cliente' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ required: false, description: 'Filtrar por veículo' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
