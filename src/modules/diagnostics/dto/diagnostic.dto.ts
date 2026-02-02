import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

export class CreateDiagnosticDto {
  @ApiProperty({ example: 'uuid-da-os', description: 'ID da Ordem de Serviço' })
  @IsUUID('4')
  serviceOrderId: string;

  @ApiProperty({
    example: 'https://storage.com/audio.webm',
    description: 'URL do áudio gravado',
    required: false
  })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiProperty({ example: 45, description: 'Duração do áudio em segundos', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  audioDuration?: number;
}

export class TranscribeAudioDto {
  @ApiProperty({ example: 'uuid-do-diagnostico' })
  @IsUUID('4')
  diagnosticId: string;
}

export class ProcessTranscriptionDto {
  @ApiProperty({ example: 'uuid-do-diagnostico' })
  @IsUUID('4')
  diagnosticId: string;

  @ApiProperty({
    example: 'Verificar amortecedor dianteiro esquerdo, está vazando óleo. Precisa trocar também a coifa do câmbio que está rasgada.',
    description: 'Transcrição manual (opcional, se não usar Whisper)',
    required: false
  })
  @IsOptional()
  @IsString()
  manualTranscription?: string;
}

// Tipos para as entidades extraídas pelo GPT
export interface ExtractedPart {
  part: string;           // Nome da peça
  position?: string;      // Posição (dianteiro, traseiro, esquerdo, direito)
  action: string;         // Ação (trocar, verificar, reparar)
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface ExtractedSymptom {
  symptom: string;        // Descrição do sintoma
  severity: 'low' | 'medium' | 'high';
  relatedParts?: string[];
}

export interface DiagnosticExtraction {
  parts: ExtractedPart[];
  symptoms: ExtractedSymptom[];
  summary: string;        // Resumo do diagnóstico
  recommendations: string[];
}
