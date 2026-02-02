"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Mic,
  ArrowRight,
} from "lucide-react";
import { serviceOrdersApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ServiceOrder {
  id: string;
  number: number;
  status: string;
  totalParts: number;
  totalLabor: number;
  totalPrice: number;
  createdAt: string;
  approvedAt?: string;
  customer: { id: string; name: string; phone: string };
  vehicle: { id: string; plate: string; brand: string; model: string; year: number };
  _count: { items: number };
}

const statusConfig: Record<string, { label: string; color: "default" | "secondary" | "success" | "warning" | "info" | "destructive" }> = {
  DRAFT: { label: "Rascunho", color: "secondary" },
  DIAGNOSING: { label: "Diagnosticando", color: "info" },
  QUOTING: { label: "Orçando", color: "info" },
  WAITING_APPROVAL: { label: "Aguard. Aprovação", color: "warning" },
  APPROVED: { label: "Aprovado", color: "success" },
  IN_PROGRESS: { label: "Em Andamento", color: "default" },
  QUALITY_CHECK: { label: "Verificação", color: "info" },
  COMPLETED: { label: "Concluído", color: "success" },
  DELIVERED: { label: "Entregue", color: "success" },
  CANCELLED: { label: "Cancelado", color: "destructive" },
};

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchOrders = async () => {
    try {
      const response = await serviceOrdersApi.getAll(
        statusFilter ? { status: statusFilter } : undefined
      );
      setOrders(response.data);
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço da oficina
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/diagnostics">
            <Button variant="outline">
              <Mic className="h-4 w-4 mr-2" />
              Diagnóstico
            </Button>
          </Link>
          <Link href="/dashboard/service-orders/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("")}
        >
          Todas
        </Button>
        {Object.entries(statusConfig).slice(0, 6).map(([key, { label }]) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma ordem de serviço encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/service-orders/${order.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">OS #{order.number}</span>
                        <Badge variant={statusConfig[order.status]?.color || "secondary"}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {order.customer.name}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-mono">
                          {order.vehicle.plate}
                        </span>
                        <span className="hidden sm:inline">-</span>
                        <span>
                          {order.vehicle.brand} {order.vehicle.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Criado: {formatDateTime(order.createdAt)}</span>
                        <span>{order._count.items} item(s)</span>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(Number(order.totalPrice))}
                        </p>
                        {(Number(order.totalParts) > 0 || Number(order.totalLabor) > 0) && (
                          <p className="text-xs text-muted-foreground">
                            Peças: {formatCurrency(Number(order.totalParts))} | MO: {formatCurrency(Number(order.totalLabor))}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
