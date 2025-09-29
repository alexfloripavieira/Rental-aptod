// API Types based on Django models

export interface Builder {
  id: number;
  name: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  video?: string;
  photos?: BuilderFoto[];
  builder_fotos: BuilderFoto[];
  created_at: string;
  updated_at: string;
}

export interface Apartment {
  id: number;
  unit_number: string;
  floor?: string;
  building_name: Builder;
  description: string;
  rental_price: number;
  is_available: boolean;
  is_furnished: boolean;
  is_pets_allowed: boolean;
  has_laundry: boolean;
  has_parking: boolean;
  has_internet: boolean;
  has_air_conditioning: boolean;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  square_footage: number;
  video?: string;
  fotos: Photo[];
  // Present in list endpoint for cover image
  main_photo?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  photos: string;
}

export interface BuilderFoto {
  id: number;
  photos: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApartmentFilters {
  is_available?: boolean;
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  has_parking?: boolean;
  has_air_conditioning?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  min_price?: number;
  max_price?: number;
}

export interface BuilderFilters {
  city?: string;
  state?: string;
  search?: string;
  page?: number;
}

// API Response types
export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  loading: boolean;
  success: boolean;
}

// Form types
export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  apartment_id?: number;
  builder_id?: number;
}

// UI State types
export interface LoadingState {
  apartments: boolean;
  builders: boolean;
  contact: boolean;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Utility types
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: keyof Apartment | keyof Builder;
  order: SortOrder;
  label: string;
}
