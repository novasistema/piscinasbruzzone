export interface PoolModel {
  id: string;
  code: string;
  name: string;
  line: 'clasica' | 'solarium';
  length: number; // in meters
  width: number;  // in meters
  depth: number;  // in meters
  capacity: number; // in liters
  costPrice?: number; // Precio de costo en ARS
  profitMargin?: number; // Porcentaje de ganancia (%)
  price: number; // Precio de venta final público en ARS
  solariumWidth?: number; // e.g. 0.90m
  imageUrl: string;
  includes: string[];
  clientMaterials: string[];
  description?: string;
  isPopular?: boolean;
}

export interface Accessory {
  id: string;
  name: string;
  category: 'luces' | 'cobertores' | 'seguridad' | 'climatizacion' | 'cascadas' | 'mantenimiento' | 'quimicos';
  costPrice?: number; // Precio de costo
  profitMargin?: number; // Porcentaje de ganancia (%)
  price: number; // Precio de venta
  description: string;
  imageUrl: string;
  isSeasonal?: boolean;
  badge?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'pre_order';
}

export interface QuoteItem {
  modelId?: string;
  modelCode?: string;
  modelName?: string;
  modelPrice?: number;
  accessoryIds?: string[];
  selectedAccessories?: { id: string; name: string; price: number }[];
  includeInstallation?: boolean;
  totalPrice: number;
}

export interface QuoteOrder {
  id: string;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  city?: string;
  poolModelCode: string;
  poolModelName: string;
  accessoriesSelected: string[];
  totalPrice: number;
  notes?: string;
  status: 'pendiente' | 'contactado' | 'presupuestado' | 'vendido' | 'cancelado';
}

export interface MaintenanceVisit {
  id: string;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  address: string;
  poolType: string;
  serviceType: 'limpieza_completa' | 'control_ph_cloro' | 'service_bomba_filtro' | 'puesta_a_punto_temporada' | 'mantenimiento_mensual';
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: 'mañana' | 'tarde';
  status: 'pendiente' | 'confirmado' | 'realizado' | 'cancelado';
  notes?: string;
  assignedTechnician?: string;
}

export interface ProjectPhoto {
  id: string;
  title: string;
  location: string;
  poolModel: string;
  imageUrl: string;
  description: string;
  date: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  location: string;
  poolModel: string;
  rating: number; // 1 to 5
  comment: string;
  avatarUrl?: string;
  date: string;
}

export interface AnnouncementPopup {
  enabled: boolean;
  badge?: string;
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaAction?: 'whatsapp' | 'catalog' | 'close';
}

export interface CompanyConfig {
  companyName: string;
  tagline: string;
  whatsappPhone: string; // formatted e.g. 5491122334455
  whatsappFormatted: string; // e.g. +54 9 11 2233-4455
  email: string;
  address: string;
  businessHours: string;
  instagram: string;
  facebook: string;
  warrantyYears: number;
  installationTerms: string;
  notIncludedTerms: string;
  adminPasswordHash?: string;
  popup?: AnnouncementPopup;
}

export interface MasterUser {
  id: string;
  username: string;
  fullName: string;
  role: 'Administrador General' | 'Agente Comercial' | 'Supervisora Técnica';
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
}
