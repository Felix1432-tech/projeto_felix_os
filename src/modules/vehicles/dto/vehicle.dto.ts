import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  Min,
  Max,
  Matches,
} from 'class-validator';

export enum FuelType {
  FLEX = 'FLEX',
  GASOLINE = 'GASOLINE',
  ETHANOL = 'ETHANOL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  CVT = 'CVT',
  AUTOMATED = 'AUTOMATED',
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'uuid-do-cliente' })
  @IsUUID('4', { message: 'ID do cliente inválido' })
  customerId: string;

  @ApiProperty({ example: 'ABC-1234', description: 'Placa do veículo (formato antigo ou Mercosul)' })
  @IsString()
  @Matches(/^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, {
    message: 'Placa inválida. Use formato ABC-1234 ou ABC1D23 (Mercosul)',
  })
  plate: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', required: false })
  @IsOptional()
  @IsString()
  chassi?: string;

  @ApiProperty({ example: '00123456789', required: false })
  @IsOptional()
  @IsString()
  renavam?: string;

  @ApiProperty({ example: 'Volkswagen' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'Gol' })
  @IsString()
  model: string;

  @ApiProperty({ example: '1.0 MPI', required: false })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ example: 2020, description: 'Ano de fabricação' })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 2021, description: 'Ano do modelo' })
  @IsInt()
  @Min(1900)
  @Max(2100)
  modelYear: number;

  @ApiProperty({ example: 'Prata', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ enum: FuelType, default: FuelType.FLEX })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiProperty({ enum: TransmissionType, default: TransmissionType.MANUAL })
  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @ApiProperty({ example: '1.0', required: false })
  @IsOptional()
  @IsString()
  engine?: string;

  @ApiProperty({ example: 45000, description: 'Quilometragem atual', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiProperty({ example: 'Veículo com histórico de batida', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

export class VehicleQueryDto {
  @ApiProperty({ required: false, description: 'Buscar por placa, marca ou modelo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filtrar por cliente' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}
