import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiagnosticExtraction, ExtractedPart, ExtractedSymptom } from '../../modules/diagnostics/dto/diagnostic.dto';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  /**
   * Transcreve áudio usando OpenAI Whisper
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('OpenAI API key não configurada, retornando mock');
      return this.mockTranscription();
    }

    try {
      const formData = new FormData();
      const uint8Array = new Uint8Array(audioBuffer);
      const blob = new Blob([uint8Array], { type: 'audio/webm' });
      formData.append('file', blob, filename);
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');
      formData.append('response_format', 'text');

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whisper API error: ${error}`);
      }

      const transcription = await response.text();
      this.logger.log(`Transcrição concluída: ${transcription.substring(0, 100)}...`);
      return transcription;
    } catch (error) {
      this.logger.error('Erro na transcrição:', error);
      throw error;
    }
  }

  /**
   * Extrai entidades (peças, sintomas) da transcrição usando GPT-4
   */
  async extractDiagnosticEntities(transcription: string): Promise<DiagnosticExtraction> {
    if (!this.apiKey) {
      this.logger.warn('OpenAI API key não configurada, retornando mock');
      return this.mockExtraction(transcription);
    }

    const systemPrompt = `Você é um assistente especializado em diagnósticos automotivos.
Analise a transcrição do mecânico e extraia as seguintes informações em JSON:

{
  "parts": [
    {
      "part": "nome da peça",
      "position": "posição (dianteiro/traseiro, esquerdo/direito, se aplicável)",
      "action": "trocar/verificar/reparar/ajustar",
      "urgency": "low/medium/high",
      "notes": "observações adicionais"
    }
  ],
  "symptoms": [
    {
      "symptom": "descrição do sintoma",
      "severity": "low/medium/high",
      "relatedParts": ["peças relacionadas"]
    }
  ],
  "summary": "resumo breve do diagnóstico em 1-2 frases",
  "recommendations": ["lista de recomendações para o cliente"]
}

Regras:
- Identifique todas as peças mencionadas
- Classifique a urgência baseado no contexto (vazamento de óleo = high, barulho leve = low)
- Seja preciso nos nomes das peças automotivas
- Mantenha o português brasileiro`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Transcrição do mecânico:\n\n"${transcription}"` }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GPT API error: ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia do GPT');
      }

      const extraction = JSON.parse(content) as DiagnosticExtraction;
      this.logger.log(`Extração concluída: ${extraction.parts.length} peças, ${extraction.symptoms.length} sintomas`);

      return extraction;
    } catch (error) {
      this.logger.error('Erro na extração:', error);
      throw error;
    }
  }

  /**
   * Mock para desenvolvimento sem API key
   */
  private mockTranscription(): string {
    return 'Verificando o veículo, o amortecedor dianteiro esquerdo está vazando óleo, precisa trocar. A coifa do câmbio também está rasgada. Freios estão ok, mas as pastilhas estão no limite, recomendo trocar em breve.';
  }

  private mockExtraction(transcription: string): DiagnosticExtraction {
    // Extração simulada baseada em palavras-chave
    const parts: ExtractedPart[] = [];
    const symptoms: ExtractedSymptom[] = [];

    const text = transcription.toLowerCase();

    // Detectar peças comuns
    if (text.includes('amortecedor')) {
      parts.push({
        part: 'Amortecedor',
        position: text.includes('dianteiro') ? 'dianteiro' : text.includes('traseiro') ? 'traseiro' : undefined,
        action: text.includes('trocar') ? 'trocar' : 'verificar',
        urgency: text.includes('vazando') ? 'high' : 'medium',
        notes: text.includes('vazando') ? 'Vazamento de óleo detectado' : undefined
      });
    }

    if (text.includes('coifa')) {
      parts.push({
        part: 'Coifa do câmbio',
        action: text.includes('rasgada') || text.includes('trocar') ? 'trocar' : 'verificar',
        urgency: text.includes('rasgada') ? 'medium' : 'low'
      });
    }

    if (text.includes('pastilha')) {
      parts.push({
        part: 'Pastilhas de freio',
        action: 'trocar',
        urgency: text.includes('limite') ? 'medium' : 'low',
        notes: 'No limite de uso'
      });
    }

    // Detectar sintomas
    if (text.includes('vazando') || text.includes('vazamento')) {
      symptoms.push({
        symptom: 'Vazamento de óleo',
        severity: 'high',
        relatedParts: ['Amortecedor']
      });
    }

    if (text.includes('barulho') || text.includes('ruído')) {
      symptoms.push({
        symptom: 'Ruído anormal',
        severity: 'medium'
      });
    }

    return {
      parts,
      symptoms,
      summary: `Diagnóstico identificou ${parts.length} peça(s) para manutenção.`,
      recommendations: parts.map(p => `${p.action.charAt(0).toUpperCase() + p.action.slice(1)} ${p.part}${p.position ? ` ${p.position}` : ''}`)
    };
  }
}
