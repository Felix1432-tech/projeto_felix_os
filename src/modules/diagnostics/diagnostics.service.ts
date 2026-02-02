import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { OpenAIService } from '../../common/services/openai.service';
import { CreateDiagnosticDto, DiagnosticExtraction } from './dto/diagnostic.dto';

@Injectable()
export class DiagnosticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Lista diagnósticos de uma OS
   */
  async findByServiceOrder(tenantId: string, serviceOrderId: string) {
    // Verificar se a OS pertence ao tenant
    const os = await this.prisma.serviceOrder.findFirst({
      where: { id: serviceOrderId, tenantId, deletedAt: null },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return this.prisma.diagnostic.findMany({
      where: { serviceOrderId },
      include: {
        mechanic: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Buscar diagnóstico por ID
   */
  async findById(tenantId: string, id: string) {
    const diagnostic = await this.prisma.diagnostic.findFirst({
      where: { id },
      include: {
        serviceOrder: {
          select: { id: true, tenantId: true, number: true },
        },
        mechanic: {
          select: { id: true, name: true },
        },
      },
    });

    if (!diagnostic || diagnostic.serviceOrder.tenantId !== tenantId) {
      throw new NotFoundException('Diagnóstico não encontrado');
    }

    return diagnostic;
  }

  /**
   * Criar novo diagnóstico (registro inicial com áudio)
   */
  async create(tenantId: string, mechanicId: string, data: CreateDiagnosticDto) {
    // Verificar se a OS existe e pertence ao tenant
    const os = await this.prisma.serviceOrder.findFirst({
      where: { id: data.serviceOrderId, tenantId, deletedAt: null },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    // Atualizar status da OS para DIAGNOSING se estiver em DRAFT
    if (os.status === 'DRAFT') {
      await this.prisma.serviceOrder.update({
        where: { id: os.id },
        data: { status: 'DIAGNOSING' },
      });
    }

    return this.prisma.diagnostic.create({
      data: {
        serviceOrderId: data.serviceOrderId,
        mechanicId,
        audioUrl: data.audioUrl,
        audioDuration: data.audioDuration,
      },
      include: {
        mechanic: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Transcrever áudio de um diagnóstico
   */
  async transcribe(tenantId: string, diagnosticId: string, audioBuffer?: Buffer) {
    const diagnostic = await this.findById(tenantId, diagnosticId);

    if (!diagnostic.audioUrl && !audioBuffer) {
      throw new BadRequestException('Nenhum áudio disponível para transcrição');
    }

    let transcription: string;

    if (audioBuffer) {
      // Transcrever áudio enviado diretamente
      transcription = await this.openaiService.transcribeAudio(audioBuffer, 'audio.webm');
    } else {
      // TODO: Baixar áudio da URL e transcrever
      // Por enquanto, usar mock se não houver buffer
      transcription = await this.openaiService.transcribeAudio(Buffer.from(''), 'audio.webm');
    }

    // Salvar transcrição
    const updated = await this.prisma.diagnostic.update({
      where: { id: diagnosticId },
      data: { transcription },
    });

    return updated;
  }

  /**
   * Processar transcrição e extrair entidades (peças, sintomas)
   */
  async processTranscription(tenantId: string, diagnosticId: string, manualTranscription?: string) {
    const diagnostic = await this.findById(tenantId, diagnosticId);

    const transcription = manualTranscription || diagnostic.transcription;

    if (!transcription) {
      throw new BadRequestException('Nenhuma transcrição disponível. Transcreva o áudio primeiro.');
    }

    // Extrair entidades usando GPT
    const extraction = await this.openaiService.extractDiagnosticEntities(transcription);

    // Salvar extração no diagnóstico
    const updated = await this.prisma.diagnostic.update({
      where: { id: diagnosticId },
      data: {
        transcription: manualTranscription || diagnostic.transcription,
        extractedParts: extraction.parts as any,
        extractedSymptoms: extraction.symptoms as any,
      },
    });

    return {
      diagnostic: updated,
      extraction,
    };
  }

  /**
   * Criar itens na OS a partir das peças extraídas
   */
  async createItemsFromExtraction(
    tenantId: string,
    diagnosticId: string,
    selectedParts?: string[], // IDs das peças a incluir (se não passar, inclui todas)
  ) {
    const diagnostic = await this.findById(tenantId, diagnosticId);

    if (!diagnostic.extractedParts) {
      throw new BadRequestException('Nenhuma peça extraída. Processe a transcrição primeiro.');
    }

    const parts = diagnostic.extractedParts as any[];
    const partsToAdd = selectedParts
      ? parts.filter((_, index) => selectedParts.includes(index.toString()))
      : parts;

    // Criar itens na OS
    const items = await Promise.all(
      partsToAdd.map(async (part) => {
        const description = part.position
          ? `${part.part} ${part.position}`
          : part.part;

        return this.prisma.oSItem.create({
          data: {
            serviceOrderId: diagnostic.serviceOrderId,
            type: 'PART',
            description: `${part.action.charAt(0).toUpperCase() + part.action.slice(1)} - ${description}`,
            quantity: 1,
            unitCost: 0,
            unitPrice: 0,
            totalPrice: 0,
          },
        });
      }),
    );

    // Atualizar status da OS para QUOTING
    await this.prisma.serviceOrder.update({
      where: { id: diagnostic.serviceOrderId },
      data: { status: 'QUOTING' },
    });

    return {
      message: `${items.length} item(s) adicionado(s) à OS`,
      items,
    };
  }

  /**
   * Fluxo completo: transcrever + extrair + (opcionalmente) criar itens
   */
  async processAudioComplete(
    tenantId: string,
    mechanicId: string,
    serviceOrderId: string,
    audioBuffer: Buffer,
    autoCreateItems = false,
  ) {
    // 1. Criar diagnóstico
    const diagnostic = await this.create(tenantId, mechanicId, {
      serviceOrderId,
      audioDuration: 0, // Será calculado do áudio
    });

    // 2. Transcrever
    const transcription = await this.openaiService.transcribeAudio(audioBuffer, 'audio.webm');

    // 3. Extrair entidades
    const extraction = await this.openaiService.extractDiagnosticEntities(transcription);

    // 4. Salvar tudo
    const updated = await this.prisma.diagnostic.update({
      where: { id: diagnostic.id },
      data: {
        transcription,
        extractedParts: extraction.parts as any,
        extractedSymptoms: extraction.symptoms as any,
      },
    });

    // 5. Criar itens automaticamente (se solicitado)
    let items: any[] = [];
    if (autoCreateItems && extraction.parts.length > 0) {
      const result = await this.createItemsFromExtraction(tenantId, diagnostic.id);
      items = result.items;
    }

    return {
      diagnostic: updated,
      extraction,
      items,
    };
  }
}
