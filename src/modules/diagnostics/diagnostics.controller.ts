import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DiagnosticsService } from './diagnostics.service';
import { CreateDiagnosticDto, ProcessTranscriptionDto } from './dto/diagnostic.dto';
import { VisionService } from '../../common/services/vision.service';

@ApiTags('diagnostics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('diagnostics')
export class DiagnosticsController {
  constructor(
    private readonly diagnosticsService: DiagnosticsService,
    private readonly visionService: VisionService,
  ) {}

  @Get('service-order/:serviceOrderId')
  @ApiOperation({ summary: 'Listar diagnósticos de uma OS' })
  @ApiResponse({ status: 200, description: 'Lista de diagnósticos' })
  async findByServiceOrder(
    @Request() req,
    @Param('serviceOrderId', ParseUUIDPipe) serviceOrderId: string,
  ) {
    return this.diagnosticsService.findByServiceOrder(req.user.tenantId, serviceOrderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar diagnóstico por ID' })
  @ApiResponse({ status: 200, description: 'Diagnóstico encontrado' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  async findById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.diagnosticsService.findById(req.user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo diagnóstico (registro inicial)' })
  @ApiResponse({ status: 201, description: 'Diagnóstico criado' })
  async create(@Request() req, @Body() createDto: CreateDiagnosticDto) {
    return this.diagnosticsService.create(
      req.user.tenantId,
      req.user.sub,
      createDto,
    );
  }

  @Post('upload-audio/:serviceOrderId')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: 'Upload de áudio e processamento completo (transcrição + extração)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de áudio (webm, mp3, wav, m4a)',
        },
        autoCreateItems: {
          type: 'boolean',
          description: 'Criar itens automaticamente na OS',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Áudio processado com sucesso' })
  async uploadAndProcess(
    @Request() req,
    @Param('serviceOrderId', ParseUUIDPipe) serviceOrderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('autoCreateItems') autoCreateItems?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de áudio é obrigatório');
    }

    const allowedMimes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/mp4'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Formato de áudio não suportado. Use webm, mp3, wav ou m4a');
    }

    return this.diagnosticsService.processAudioComplete(
      req.user.tenantId,
      req.user.sub,
      serviceOrderId,
      file.buffer,
      autoCreateItems === 'true',
    );
  }

  @Post(':id/transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({ summary: 'Transcrever áudio de um diagnóstico existente' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Transcrição concluída' })
  async transcribe(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.diagnosticsService.transcribe(
      req.user.tenantId,
      id,
      file?.buffer,
    );
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Processar transcrição e extrair peças/sintomas' })
  @ApiResponse({
    status: 200,
    description: 'Extração concluída',
    schema: {
      properties: {
        diagnostic: { type: 'object' },
        extraction: {
          type: 'object',
          properties: {
            parts: { type: 'array' },
            symptoms: { type: 'array' },
            summary: { type: 'string' },
            recommendations: { type: 'array' },
          },
        },
      },
    },
  })
  async process(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessTranscriptionDto,
  ) {
    return this.diagnosticsService.processTranscription(
      req.user.tenantId,
      id,
      dto.manualTranscription,
    );
  }

  @Post(':id/create-items')
  @ApiOperation({ summary: 'Criar itens na OS a partir das peças extraídas' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        selectedParts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Índices das peças a incluir (opcional, padrão: todas)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Itens criados na OS' })
  async createItems(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('selectedParts') selectedParts?: string[],
  ) {
    return this.diagnosticsService.createItemsFromExtraction(
      req.user.tenantId,
      id,
      selectedParts,
    );
  }

  @Post('text/:serviceOrderId')
  @ApiOperation({ summary: 'Criar diagnóstico a partir de texto (sem áudio)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: {
          type: 'string',
          example: 'Amortecedor dianteiro esquerdo vazando, precisa trocar. Pastilhas de freio no limite.',
        },
        autoCreateItems: {
          type: 'boolean',
          default: false,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Diagnóstico processado' })
  async createFromText(
    @Request() req,
    @Param('serviceOrderId', ParseUUIDPipe) serviceOrderId: string,
    @Body('text') text: string,
    @Body('autoCreateItems') autoCreateItems?: boolean,
  ) {
    if (!text || text.trim().length < 10) {
      throw new BadRequestException('Texto do diagnóstico deve ter pelo menos 10 caracteres');
    }

    // Criar diagnóstico
    const diagnostic = await this.diagnosticsService.create(
      req.user.tenantId,
      req.user.sub,
      { serviceOrderId },
    );

    // Processar texto
    const result = await this.diagnosticsService.processTranscription(
      req.user.tenantId,
      diagnostic.id,
      text,
    );

    // Criar itens se solicitado
    if (autoCreateItems && result.extraction.parts.length > 0) {
      const itemsResult = await this.diagnosticsService.createItemsFromExtraction(
        req.user.tenantId,
        diagnostic.id,
      );
      return { ...result, items: itemsResult.items };
    }

    return result;
  }

  @Post('analyze-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Analisar foto de peça/componente com IA (GPT-4 Vision)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Foto da peça/componente a ser analisada',
        },
        context: {
          type: 'string',
          description: 'Contexto adicional do mecânico (opcional)',
          example: 'Cliente reclamou de barulho ao frear',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Análise da imagem concluída',
    schema: {
      properties: {
        description: { type: 'string' },
        parts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string', enum: ['good', 'worn', 'damaged', 'critical'] },
              notes: { type: 'string' },
            },
          },
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async analyzeImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('context') context?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Imagem é obrigatória');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Formato de imagem não suportado. Use JPEG, PNG, WebP ou GIF');
    }

    const analysis = await this.visionService.analyzePartImage(file.buffer, context);

    return {
      ...analysis,
      message: `Análise concluída: ${analysis.parts.length} peça(s) identificada(s), ${analysis.issues.length} problema(s) detectado(s)`,
    };
  }

  @Post('analyze-image/:serviceOrderId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Analisar foto e adicionar ao diagnóstico da OS' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Foto da peça/componente',
        },
        context: {
          type: 'string',
          description: 'Contexto adicional do mecânico',
        },
        autoCreateItems: {
          type: 'boolean',
          description: 'Criar itens automaticamente na OS',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagem analisada e diagnóstico criado' })
  async analyzeImageForOS(
    @Request() req,
    @Param('serviceOrderId', ParseUUIDPipe) serviceOrderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('context') context?: string,
    @Body('autoCreateItems') autoCreateItems?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Imagem é obrigatória');
    }

    // Analisar imagem
    const analysis = await this.visionService.analyzePartImage(file.buffer, context);

    // Converter análise de imagem para texto de diagnóstico
    const diagnosticText = this.formatImageAnalysisAsDiagnostic(analysis);

    // Criar diagnóstico
    const diagnostic = await this.diagnosticsService.create(
      req.user.tenantId,
      req.user.sub,
      { serviceOrderId },
    );

    // Processar como texto
    const result = await this.diagnosticsService.processTranscription(
      req.user.tenantId,
      diagnostic.id,
      diagnosticText,
    );

    // Criar itens se solicitado
    if (autoCreateItems === 'true' && result.extraction.parts.length > 0) {
      const itemsResult = await this.diagnosticsService.createItemsFromExtraction(
        req.user.tenantId,
        diagnostic.id,
      );
      return {
        ...result,
        imageAnalysis: analysis,
        items: itemsResult.items,
      };
    }

    return {
      ...result,
      imageAnalysis: analysis,
    };
  }

  /**
   * Converte análise de imagem em texto para processamento de diagnóstico
   */
  private formatImageAnalysisAsDiagnostic(analysis: any): string {
    const lines: string[] = [];

    lines.push(`Análise visual: ${analysis.description}`);

    for (const part of analysis.parts) {
      const conditionMap: Record<string, string> = {
        good: 'em bom estado',
        worn: 'com desgaste',
        damaged: 'danificado',
        critical: 'em estado crítico, troca urgente',
      };
      lines.push(`${part.name}: ${conditionMap[part.condition] || part.condition}. ${part.notes}`);
    }

    if (analysis.issues.length > 0) {
      lines.push(`Problemas identificados: ${analysis.issues.join(', ')}`);
    }

    if (analysis.recommendations.length > 0) {
      lines.push(`Recomendações: ${analysis.recommendations.join(', ')}`);
    }

    return lines.join('. ');
  }
}
