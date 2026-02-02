"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  User,
  Car,
  Phone,
  Calendar,
  Gauge,
  Fuel,
  Plus,
  Trash2,
  Mic,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { serviceOrdersApi } from "@/lib/api";
import { formatCurrency, formatDateTime, formatPlate, formatPhone } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: "default" | "secondary" | "success" | "warning" | "info" | "destructive"; next?: string }> = {
  DRAFT: { label: "Rascunho", color: "secondary", next: "DIAGNOSING" },
  DIAGNOSING: { label: "Diagnosticando", color: "info", next: "QUOTING" },
  QUOTING: { label: "Orçando", color: "info", next: "WAITING_APPROVAL" },
  WAITING_APPROVAL: { label: "Aguard. Aprovação", color: "warning", next: "APPROVED" },
  APPROVED: { label: "Aprovado", color: "success", next: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Em Andamento", color: "default", next: "QUALITY_CHECK" },
  QUALITY_CHECK: { label: "Verificação", color: "info", next: "COMPLETED" },
  COMPLETED: { label: "Concluído", color: "success", next: "DELIVERED" },
  DELIVERED: { label: "Entregue", color: "success" },
  CANCELLED: { label: "Cancelado", color: "destructive" },
};

const nextStatusLabels: Record<string, string> = {
  DIAGNOSING: "Iniciar Diagnóstico",
  QUOTING: "Enviar p/ Orçamento",
  WAITING_APPROVAL: "Enviar p/ Aprovação",
  APPROVED: "Cliente Aprovou",
  IN_PROGRESS: "Iniciar Serviço",
  QUALITY_CHECK: "Enviar p/ Verificação",
  COMPLETED: "Marcar Concluído",
  DELIVERED: "Marcar Entregue",
};

export default function ServiceOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const fetchOrder = async () => {
    try {
      const response = await serviceOrdersApi.getById(params.id as string);
      setOrder(response.data);
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await serviceOrdersApi.updateStatus(order.id, newStatus);
      fetchOrder();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Remover este item?")) return;
    try {
      await serviceOrdersApi.removeItem(order.id, itemId);
      fetchOrder();
    } catch (error) {
      console.error("Erro ao remover item:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">OS não encontrada</p>
        <Link href="/dashboard/service-orders">
          <Button variant="link">Voltar</Button>
        </Link>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status];
  const nextStatus = currentStatus?.next;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/service-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">OS #{order.number}</h1>
              <Badge variant={currentStatus?.color || "secondary"}>
                {currentStatus?.label || order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Criada em {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {order.status === "DIAGNOSING" && (
            <Link href={`/dashboard/diagnostics?os=${order.id}`}>
              <Button variant="outline">
                <Mic className="h-4 w-4 mr-2" />
                Diagnóstico
              </Button>
            </Link>
          )}
          {nextStatus && order.status !== "CANCELLED" && (
            <Button onClick={() => handleStatusChange(nextStatus)} disabled={updating}>
              {updating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {nextStatusLabels[nextStatus]}
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Customer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.customer.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Phone className="h-3 w-3" />
              <a href={`tel:${order.customer.phone}`}>{formatPhone(order.customer.phone)}</a>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Veículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono font-medium">{formatPlate(order.vehicle.plate)}</p>
            <p className="text-sm text-muted-foreground">
              {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {order.mileageIn && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {order.mileageIn.toLocaleString()} km
                </span>
              )}
              {order.fuelLevel && (
                <span className="flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  {order.fuelLevel}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry Notes */}
      {order.entryNotes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Observações de Entrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.entryNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens da OS</CardTitle>
          <Button size="sm" onClick={() => setShowAddItem(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Item
          </Button>
        </CardHeader>
        <CardContent>
          {order.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum item adicionado
            </p>
          ) : (
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === "PART" ? "default" : "secondary"}>
                        {item.type === "PART" ? "Peça" : "Serviço"}
                      </Badge>
                      <span className="font-medium">{item.description}</span>
                    </div>
                    {item.partNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Código: {item.partNumber} {item.brand && `• ${item.brand}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {Number(item.quantity)} x {formatCurrency(Number(item.unitPrice))}
                      </p>
                      <p className="font-medium">{formatCurrency(Number(item.totalPrice))}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Peças</span>
              <span>{formatCurrency(Number(order.totalParts))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mão de Obra</span>
              <span>{formatCurrency(Number(order.totalLabor))}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(Number(order.totalPrice))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          orderId={order.id}
          onClose={() => setShowAddItem(false)}
          onSave={() => {
            setShowAddItem(false);
            fetchOrder();
          }}
        />
      )}
    </div>
  );
}

// Add Item Modal
function AddItemModal({
  orderId,
  onClose,
  onSave,
}: {
  orderId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "PART",
    description: "",
    partNumber: "",
    brand: "",
    quantity: 1,
    unitCost: 0,
    unitPrice: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await serviceOrdersApi.addItem(orderId, formData);
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao adicionar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Adicionar Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-9 rounded-md border px-3 text-sm"
              >
                <option value="PART">Peça</option>
                <option value="SERVICE">Serviço</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Amortecedor dianteiro"
                required
              />
            </div>

            {formData.type === "PART" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <Input
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Marca</label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Qtd</label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Custo</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Preço</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" isLoading={loading} className="flex-1">
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
