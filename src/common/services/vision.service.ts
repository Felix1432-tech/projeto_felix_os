import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlateOCRResult {
  plate: string | null;
  confidence: number;
  rawText: string;
  suggestions?: string[];
}

export interface ImageAnalysisResult {
  description: string;
  parts: {
    name: string;
    condition: 'good' | 'worn' | 'damaged' | 'critical';
    notes: string;
  }[];
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly googleApiKey: string;
  private readonly openaiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_CLOUD_API_KEY') || '';
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  /**
   * OCR de placa de veículo usando Google Cloud Vision
   * Suporta placas brasileiras: ABC-1234 (antiga) e ABC1D23 (Mercosul)
   */
  async recognizePlate(imageBuffer: Buffer): Promise<PlateOCRResult> {
    if (!this.googleApiKey) {
      this.logger.warn('Google Cloud API key não configurada, usando mock');
      return this.mockPlateOCR();
    }

    try {
      const base64Image = imageBuffer.toString('base64');

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [
                  { type: 'TEXT_DETECTION', maxResults: 10 },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Vision API error: ${error}`);
      }

      const data = await response.json();
      const textAnnotations = data.responses[0]?.textAnnotations || [];

      if (textAnnotations.length === 0) {
        return {
          plate: null,
          confidence: 0,
          rawText: '',
          suggestions: [],
        };
      }

      const rawText = textAnnotations[0]?.description || '';
      const plate = this.extractPlateFromText(rawText);

      this.logger.log(`OCR concluído: ${plate || 'não encontrado'}`);

      return {
        plate,
        confidence: plate ? 0.9 : 0,
        rawText,
        suggestions: this.generatePlateSuggestions(rawText),
      };
    } catch (error) {
      this.logger.error('Erro no OCR de placa:', error);
      throw error;
    }
  }

  /**
   * Extrai placa brasileira do texto usando regex
   * Suporta formato antigo (ABC-1234) e Mercosul (ABC1D23)
   */
  private extractPlateFromText(text: string): string | null {
    // Remove espaços e converte para maiúsculas
    const cleanText = text.replace(/\s+/g, '').toUpperCase();

    // Formato Mercosul: ABC1D23 (3 letras, 1 número, 1 letra, 2 números)
    const mercosulRegex = /[A-Z]{3}[0-9][A-Z][0-9]{2}/g;
    const mercosulMatch = cleanText.match(mercosulRegex);
    if (mercosulMatch) {
      return mercosulMatch[0];
    }

    // Formato antigo: ABC1234 ou ABC-1234 (3 letras, 4 números)
    const antigoRegex = /[A-Z]{3}[0-9]{4}/g;
    const antigoMatch = cleanText.match(antigoRegex);
    if (antigoMatch) {
      return antigoMatch[0];
    }

    return null;
  }

  /**
   * Gera sugestões de placas similares caso OCR tenha erros
   */
  private generatePlateSuggestions(rawText: string): string[] {
    const suggestions: string[] = [];
    const cleanText = rawText.replace(/\s+/g, '').toUpperCase();

    // Substitui caracteres comumente confundidos
    const replacements: Record<string, string[]> = {
      'O': ['0', 'Q', 'D'],
      '0': ['O', 'Q', 'D'],
      'I': ['1', 'L', 'T'],
      '1': ['I', 'L', 'T'],
      'S': ['5', '8'],
      '5': ['S', '6'],
      'B': ['8', '6'],
      '8': ['B', '6'],
      'G': ['6', 'C'],
      '6': ['G', 'C'],
      'Z': ['2', '7'],
      '2': ['Z', '7'],
    };

    // Tenta encontrar padrão de placa com substituições
    for (let i = 0; i < cleanText.length - 6; i++) {
      const segment = cleanText.substring(i, i + 7);
      if (/^[A-Z0-9]{7}$/.test(segment)) {
        suggestions.push(segment);
      }
    }

    return [...new Set(suggestions)].slice(0, 3);
  }

  /**
   * Analisa foto de peça/componente usando GPT-4 Vision
   */
  async analyzePartImage(imageBuffer: Buffer, context?: string): Promise<ImageAnalysisResult> {
    if (!this.openaiApiKey) {
      this.logger.warn('OpenAI API key não configurada, usando mock');
      return this.mockImageAnalysis();
    }

    try {
      const base64Image = imageBuffer.toString('base64');

      const systemPrompt = `Você é um especialista em diagnóstico automotivo.
Analise a imagem da peça/componente e retorne um JSON com:

{
  "description": "Descrição geral do que você vê na imagem",
  "parts": [
    {
      "name": "nome da peça identificada",
      "condition": "good/worn/damaged/critical",
      "notes": "observações específicas"
    }
  ],
  "issues": ["lista de problemas identificados"],
  "recommendations": ["recomendações de manutenção/troca"]
}

Seja específico sobre:
- Sinais de desgaste (ferrugem, rachaduras, vazamentos)
- Estado das borrachas/vedações
- Nível de fluidos (se visível)
- Comparação com estado normal da peça`;

      const userPrompt = context
        ? `Contexto adicional do mecânico: "${context}"\n\nAnalise esta imagem:`
        : 'Analise esta imagem de peça automotiva:';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GPT-4 Vision API error: ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia do GPT-4 Vision');
      }

      const analysis = JSON.parse(content) as ImageAnalysisResult;
      this.logger.log(`Análise de imagem concluída: ${analysis.parts.length} peça(s) identificada(s)`);

      return analysis;
    } catch (error) {
      this.logger.error('Erro na análise de imagem:', error);
      throw error;
    }
  }

  /**
   * Mock OCR para desenvolvimento sem API key
   */
  private mockPlateOCR(): PlateOCRResult {
    const mockPlates = ['ABC1D23', 'XYZ4E56', 'BRA2E19'];
    const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];

    return {
      plate: randomPlate,
      confidence: 0.95,
      rawText: `Placa do veículo: ${randomPlate}\nBRASIL`,
      suggestions: [],
    };
  }

  /**
   * Mock análise de imagem para desenvolvimento sem API key
   */
  private mockImageAnalysis(): ImageAnalysisResult {
    return {
      description: 'Imagem de peça automotiva (modo simulação)',
      parts: [
        {
          name: 'Pastilha de freio',
          condition: 'worn',
          notes: 'Desgaste de aproximadamente 70%, recomendada troca em breve',
        },
      ],
      issues: [
        'Desgaste avançado da pastilha',
        'Possível contaminação por óleo',
      ],
      recommendations: [
        'Substituir pastilhas de freio em até 5.000 km',
        'Verificar possível vazamento de fluido',
      ],
    };
  }
}
