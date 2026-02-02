"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Car,
  ClipboardList,
  Clock,
  Plus,
  ArrowRight,
  Mic,
} from "lucide-react";
import Link from "next/link";
import { tenantsApi, serviceOrdersApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Stats {
  customers: number;
  vehicles: number;
  serviceOrders: number;
  pendingOrders: number;
}

interface ServiceOrder {
  id: string;
  number: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  customer: { name: string };
  vehicle: { plate: string; brand: string; model: string };
}

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "info" | "destructive"> = {
  DRAFT: "secondary",
  DIAGNOSING: "info",
  QUOTING: "info",
  WAITING_APPROVAL: "warning",
  APPROVED: "success",
  IN_PROGRESS: "default",
  QUALITY_CHECK: "info",
  COMPLETED: "success",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  DIAGNOSING: "Diagnosticando",
  QUOTING: "Orçando",
  WAITING_APPROVAL: "Aguardando Aprovação",
  APPROVED: "Aprovado",
  IN_PROGRESS: "Em Andamento",
  QUALITY_CHECK: "Verificação",
  COMPLETED: "Concluído",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          tenantsApi.getStats(),
          serviceOrdersApi.getAll(),
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua oficina
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/diagnostics/new">
            <Button variant="outline">
              <Mic className="h-4 w-4 mr-2" />
              Diagnóstico por Voz
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.customers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Veículos
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vehicles || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de OS
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.serviceOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OS Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.pendingOrders || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ordens de Serviço Recentes</CardTitle>
          <Link href="/dashboard/service-orders">
            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma ordem de serviço encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/service-orders/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">OS #{order.number}</span>
                      <Badge variant={statusColors[order.status]}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.customer.name} • {order.vehicle.plate} - {order.vehicle.brand} {order.vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(order.totalPrice))}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
