"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { diagnosticsApi, serviceOrdersApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ExtractedPart {
  part: string;
  position?: string;
  action: string;
  urgency: "low" | "medium" | "high";
  notes?: string;
}

interface DiagnosticResult {
  diagnostic: any;
  extraction: {
    parts: ExtractedPart[];
    symptoms: any[];
    summary: string;
    recommendations: string[];
  };
  items?: any[];
}

export default function DiagnosticsPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState("");
  const [selectedOS, setSelectedOS] = useState<string>("");
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [manualText, setManualText] = useState("");
  const [mode, setMode] = useState<"voice" | "text">("voice");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Carregar OS em andamento
    serviceOrdersApi.getAll({ status: "DIAGNOSING" }).then((res) => {
      setServiceOrders(res.data);
      if (res.data.length > 0) {
        setSelectedOS(res.data[0].id);
      }
    });
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
    } catch (err) {
      setError("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    if (!audioBlob || !selectedOS) return;

    setIsProcessing(true);
    setError("");

    try {
      const file = new File([audioBlob], "diagnostic.webm", { type: "audio/webm" });
      const response = await diagnosticsApi.uploadAudio(selectedOS, file, false);
      setResult(response.data);
      setTranscription(response.data.diagnostic.transcription || "");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao processar áudio");
    } finally {
      setIsProcessing(false);
    }
  };

  const processText = async () => {
    if (!manualText.trim() || !selectedOS) return;

    setIsProcessing(true);
    setError("");

    try {
      const response = await diagnosticsApi.processText(selectedOS, manualText, false);
      setResult(response.data);
      setTranscription(manualText);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao processar texto");
    } finally {
      setIsProcessing(false);
    }
  };

  const createItems = async () => {
    if (!result?.diagnostic?.id) return;

    setIsProcessing(true);
    try {
      await diagnosticsApi.createItems(result.diagnostic.id);
      setResult((prev) => prev ? { ...prev, items: result?.extraction?.parts } : null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar itens");
    } finally {
      setIsProcessing(false);
    }
  };

  const urgencyColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="h-6 w-6" />
          Diagnóstico por Voz
        </h1>
        <p className="text-muted-foreground">
          Fale o diagnóstico e o sistema extrai automaticamente as peças e serviços
        </p>
      </div>

      {/* OS Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Ordem de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma OS em diagnóstico. Crie uma nova OS primeiro.
            </p>
          ) : (
            <div className="grid gap-2">
              {serviceOrders.map((os) => (
                <button
                  key={os.id}
                  onClick={() => setSelectedOS(os.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
                    selectedOS === os.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  )}
                >
                  <div>
                    <span className="font-medium">OS #{os.number}</span>
                    <p className="text-sm text-muted-foreground">
                      {os.vehicle.plate} - {os.vehicle.brand} {os.vehicle.model}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "voice" ? "default" : "outline"}
          onClick={() => setMode("voice")}
        >
          <Mic className="h-4 w-4 mr-2" />
          Gravar Voz
        </Button>
        <Button
          variant={mode === "text" ? "default" : "outline"}
          onClick={() => setMode("text")}
        >
          Digitar Texto
        </Button>
      </div>

      {/* Recording / Text Input */}
      <Card>
        <CardContent className="pt-6">
          {mode === "voice" ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!selectedOS}
                className={cn(
                  "h-24 w-24 rounded-full flex items-center justify-center transition-all",
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-primary hover:bg-primary/90",
                  !selectedOS && "opacity-50 cursor-not-allowed"
                )}
              >
                {isRecording ? (
                  <Square className="h-8 w-8 text-white" />
                ) : (
                  <Mic className="h-8 w-8 text-white" />
                )}
              </button>
              <p className="text-sm text-muted-foreground">
                {isRecording
                  ? "Gravando... Clique para parar"
                  : "Clique para iniciar a gravação"}
              </p>

              {audioBlob && !isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-md" />
                  <Button onClick={processAudio} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Processar Áudio
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Digite o diagnóstico aqui... Ex: Amortecedor dianteiro esquerdo vazando, precisa trocar. Pastilhas de freio no limite."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!selectedOS}
              />
              <Button
                onClick={processText}
                disabled={isProcessing || !manualText.trim() || !selectedOS}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Analisar Diagnóstico
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Transcription */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transcrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground italic">"{transcription}"</p>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{result.extraction.summary}</p>
            </CardContent>
          </Card>

          {/* Extracted Parts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Peças Identificadas ({result.extraction.parts.length})</span>
                {!result.items && result.extraction.parts.length > 0 && (
                  <Button onClick={createItems} disabled={isProcessing} size="sm">
                    Adicionar à OS
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.extraction.parts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma peça identificada
                </p>
              ) : (
                <div className="space-y-3">
                  {result.extraction.parts.map((part, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{part.part}</span>
                          {part.position && (
                            <Badge variant="outline">{part.position}</Badge>
                          )}
                          <Badge className={urgencyColors[part.urgency]}>
                            {part.urgency === "high"
                              ? "Urgente"
                              : part.urgency === "medium"
                              ? "Médio"
                              : "Baixo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ação: {part.action}
                          {part.notes && ` - ${part.notes}`}
                        </p>
                      </div>
                      {result.items && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result.extraction.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {result.extraction.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.items && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-800 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              Itens adicionados à OS com sucesso!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
