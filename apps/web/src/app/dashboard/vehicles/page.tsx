"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Car,
  User,
  Gauge,
  Pencil,
  Trash2,
  Fuel,
} from "lucide-react";
import { vehiclesApi, customersApi } from "@/lib/api";
import { formatPlate } from "@/lib/utils";

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  modelYear: number;
  color?: string;
  fuelType: string;
  mileage: number;
  customer: { id: string; name: string; phone: string };
  _count: { serviceOrders: number };
}

const fuelLabels: Record<string, string> = {
  FLEX: "Flex",
  GASOLINE: "Gasolina",
  ETHANOL: "Etanol",
  DIESEL: "Diesel",
  ELECTRIC: "Elétrico",
  HYBRID: "Híbrido",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesApi.getAll({ search: search || undefined });
      setVehicles(response.data);
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este veículo?")) return;
    try {
      await vehiclesApi.delete(id);
      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-muted-foreground">
            Gerencie os veículos cadastrados
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por placa, marca ou modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => {
            setShowForm(false);
            setEditingVehicle(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingVehicle(null);
            fetchVehicles();
          }}
        />
      )}

      {/* Vehicles List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-base">
                        {formatPlate(vehicle.plate)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-1">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    {vehicle.version && (
                      <p className="text-sm text-muted-foreground">{vehicle.version}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{vehicle.customer.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{vehicle.year}/{vehicle.modelYear}</span>
                  </div>
                  {vehicle.color && (
                    <Badge variant="secondary">{vehicle.color}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span>{fuelLabels[vehicle.fuelType] || vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span>{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Badge variant="secondary">
                    {vehicle._count.serviceOrders} OS
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Vehicle Form Component
function VehicleForm({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: vehicle?.customer.id || "",
    plate: vehicle?.plate || "",
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    version: vehicle?.version || "",
    year: vehicle?.year || new Date().getFullYear(),
    modelYear: vehicle?.modelYear || new Date().getFullYear(),
    color: vehicle?.color || "",
    fuelType: vehicle?.fuelType || "FLEX",
    mileage: vehicle?.mileage || 0,
  });

  useEffect(() => {
    customersApi.getAll().then((res) => setCustomers(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (vehicle) {
        await vehiclesApi.update(vehicle.id, formData);
      } else {
        await vehiclesApi.create(formData);
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{vehicle ? "Editar Veículo" : "Novo Veículo"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cliente *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full h-9 rounded-md border px-3 text-sm"
                required
              >
                <option value="">Selecione...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Placa *</label>
                <Input
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  placeholder="ABC1D23"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Marca *</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Modelo *</label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Versão</label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0 MPI"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Ano Fab. *</label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ano Mod. *</label>
                <Input
                  type="number"
                  value={formData.modelYear}
                  onChange={(e) => setFormData({ ...formData, modelYear: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Km</label>
                <Input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Combustível</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full h-9 rounded-md border px-3 text-sm"
              >
                <option value="FLEX">Flex</option>
                <option value="GASOLINE">Gasolina</option>
                <option value="ETHANOL">Etanol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Elétrico</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" isLoading={loading} className="flex-1">
                {vehicle ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
