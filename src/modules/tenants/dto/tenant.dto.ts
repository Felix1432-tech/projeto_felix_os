import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  Min,
  Max,
} from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Auto Center Silva', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Centro Automotivo Silva', required: false })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({ example: '(11) 3333-4444', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '(11) 99999-9999', required: false })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ example: 'contato@autocenter.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Endereço
  @ApiProperty({ example: 'Rua das Flores', required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: '123', required: false })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ example: 'Sala 1', required: false })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Centro', required: false })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({ example: 'São Paulo', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'SP', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '01234-567', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  // Aparência
  @ApiProperty({ example: 'https://storage.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: '#1E40AF', required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  // Configurações de negócio
  @ApiProperty({ example: 30, description: 'Markup padrão em %', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  defaultMarkup?: number;

  @ApiProperty({ example: 150, description: 'Valor padrão da hora de mão de obra', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultLaborRate?: number;
}
