"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  User,
  Car,
  Plus,
  Check,
} from "lucide-react";
import Link from "next/link";
import { customersApi, vehiclesApi, serviceOrdersApi } from "@/lib/api";
import { formatPlate, formatPhone } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  vehicles: Vehicle[];
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
}

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    mileageIn: 0,
    fuelLevel: 50,
    entryNotes: "",
  });

  useEffect(() => {
    if (searchCustomer.length >= 2) {
      customersApi.getAll(searchCustomer).then((res) => setCustomers(res.data));
    }
  }, [searchCustomer]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    if (customer.vehicles.length === 1) {
      setSelectedVehicle(customer.vehicles[0]);
      setFormData({ ...formData, mileageIn: customer.vehicles[0].mileage });
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({ ...formData, mileageIn: vehicle.mileage });
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedVehicle) return;

    setLoading(true);
    try {
      const response = await serviceOrdersApi.create({
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        mileageIn: formData.mileageIn,
        fuelLevel: formData.fuelLevel,
        entryNotes: formData.entryNotes,
      });

      router.push(`/dashboard/service-orders/${response.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao criar OS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/service-orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>
          <p className="text-muted-foreground">
            Passo {step} de 3
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Selecionar Cliente
            </CardTitle>
            <CardDescription>
              Busque o cliente pelo nome, telefone ou CPF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite para buscar..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="pl-10"
              />
            </div>

            {customers.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted text-left"
                  >
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhone(customer.phone)} • {customer.vehicles.length} veículo(s)
                      </p>
                    </div>
                    <Check className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {searchCustomer.length >= 2 && customers.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum cliente encontrado</p>
                <Link href="/dashboard/customers">
                  <Button variant="link" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Cadastrar novo cliente
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Vehicle */}
      {step === 2 && selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Selecionar Veículo
            </CardTitle>
            <CardDescription>
              Cliente: {selectedCustomer.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCustomer.vehicles.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>Este cliente não tem veículos cadastrados</p>
                <Link href="/dashboard/vehicles">
                  <Button variant="link" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Cadastrar veículo
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedCustomer.vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleSelectVehicle(vehicle)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted text-left"
                  >
                    <div>
                      <p className="font-mono font-medium">{formatPlate(vehicle.plate)}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} {vehicle.year} • {vehicle.mileage.toLocaleString()} km
                      </p>
                    </div>
                    <Check className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            <Button variant="outline" onClick={() => setStep(1)} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Entry Details */}
      {step === 3 && selectedCustomer && selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Dados de Entrada</CardTitle>
            <CardDescription>
              {selectedCustomer.name} • {formatPlate(selectedVehicle.plate)} - {selectedVehicle.brand} {selectedVehicle.model}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Quilometragem</label>
                <Input
                  type="number"
                  value={formData.mileageIn}
                  onChange={(e) => setFormData({ ...formData, mileageIn: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nível Combustível (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.fuelLevel}
                  onChange={(e) => setFormData({ ...formData, fuelLevel: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Observações de Entrada</label>
              <textarea
                value={formData.entryNotes}
                onChange={(e) => setFormData({ ...formData, entryNotes: e.target.value })}
                placeholder="Relato do cliente, observações visuais..."
                className="w-full h-24 p-3 border rounded-lg resize-none text-sm"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleSubmit} isLoading={loading} className="flex-1">
                Criar OS
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
