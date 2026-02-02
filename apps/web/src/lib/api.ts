import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
};

// Tenants
export const tenantsApi = {
  getMe: () => api.get("/tenants/me"),
  getStats: () => api.get("/tenants/me/stats"),
  update: (data: any) => api.put("/tenants/me", data),
};

// Users
export const usersApi = {
  getMe: () => api.get("/users/me"),
  getAll: () => api.get("/users"),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Customers
export const customersApi = {
  getAll: (search?: string) => api.get("/customers", { params: { search } }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post("/customers", data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Vehicles
export const vehiclesApi = {
  getAll: (params?: { search?: string; customerId?: string }) =>
    api.get("/vehicles", { params }),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  getByPlate: (plate: string) => api.get(`/vehicles/plate/${plate}`),
  create: (data: any) => api.post("/vehicles", data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

// Service Orders
export const serviceOrdersApi = {
  getAll: (params?: { status?: string; customerId?: string; vehicleId?: string }) =>
    api.get("/service-orders", { params }),
  getById: (id: string) => api.get(`/service-orders/${id}`),
  create: (data: any) => api.post("/service-orders", data),
  update: (id: string, data: any) => api.put(`/service-orders/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/service-orders/${id}/status`, { status }),
  addItem: (id: string, data: any) => api.post(`/service-orders/${id}/items`, data),
  removeItem: (id: string, itemId: string) =>
    api.delete(`/service-orders/${id}/items/${itemId}`),
  delete: (id: string) => api.delete(`/service-orders/${id}`),
};

// Diagnostics
export const diagnosticsApi = {
  getByServiceOrder: (serviceOrderId: string) =>
    api.get(`/diagnostics/service-order/${serviceOrderId}`),
  getById: (id: string) => api.get(`/diagnostics/${id}`),
  create: (data: any) => api.post("/diagnostics", data),
  uploadAudio: (serviceOrderId: string, file: File, autoCreateItems = false) => {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("autoCreateItems", autoCreateItems.toString());
    return api.post(`/diagnostics/upload-audio/${serviceOrderId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  processText: (serviceOrderId: string, text: string, autoCreateItems = false) =>
    api.post(`/diagnostics/text/${serviceOrderId}`, { text, autoCreateItems }),
  process: (id: string, manualTranscription?: string) =>
    api.post(`/diagnostics/${id}/process`, { diagnosticId: id, manualTranscription }),
  createItems: (id: string, selectedParts?: string[]) =>
    api.post(`/diagnostics/${id}/create-items`, { selectedParts }),
};
