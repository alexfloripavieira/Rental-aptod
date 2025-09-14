import axios, { type AxiosInstance, AxiosError } from 'axios';
import type {
  Apartment,
  Builder,
  PaginatedResponse,
  ApartmentFilters,
  BuilderFilters,
  ContactForm,
  ApiError
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (import.meta.env.DEV) {
          console.warn(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (import.meta.env.DEV) {
          console.warn(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error: AxiosError) => {
        if (import.meta.env.DEV) {
          console.error('❌ API Error:', error.response?.data || error.message);
        }

        // Transform error to our ApiError format
        const apiError: ApiError = {
          message: this.getErrorMessage(error),
          code: error.code,
        };

        return Promise.reject(apiError);
      }
    );
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as Record<string, unknown>;

      // Handle different error formats
      if (typeof data === 'string') return data;
      if (data.detail && typeof data.detail === 'string') return data.detail;
      if (data.message && typeof data.message === 'string') return data.message;
      if (data.error && typeof data.error === 'string') return data.error;

      // Handle field errors
      if (typeof data === 'object') {
        const firstField = Object.keys(data)[0];
        if (firstField && Array.isArray(data[firstField])) {
          return data[firstField][0];
        }
      }
    }

    if (error.code === 'NETWORK_ERROR') {
      return 'Erro de conexão. Verifique sua internet.';
    }

    if (error.code === 'TIMEOUT') {
      return 'Tempo limite excedido. Tente novamente.';
    }

    return error.message || 'Erro inesperado ocorreu.';
  }

  // Apartments API
  async getApartments(filters?: ApartmentFilters): Promise<PaginatedResponse<Apartment>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await this.client.get<PaginatedResponse<Apartment>>(
      `/aptos/?${params.toString()}`
    );
    return response.data;
  }

  async getApartment(id: number): Promise<Apartment> {
    const response = await this.client.get<Apartment>(`/aptos/${id}/`);
    return response.data;
  }

  async getAvailableApartments(): Promise<PaginatedResponse<Apartment>> {
    return this.getApartments({ is_available: true });
  }

  // Builders API
  async getBuilders(filters?: BuilderFilters): Promise<PaginatedResponse<Builder>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await this.client.get<PaginatedResponse<Builder>>(
      `/builders/?${params.toString()}`
    );
    return response.data;
  }

  async getBuilder(id: number): Promise<Builder> {
    const response = await this.client.get<Builder>(`/builders/${id}/`);
    return response.data;
  }

  // Contact API (future implementation)
  async submitContact(contactData: ContactForm): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/contact/', contactData);
    return response.data;
  }

  // Utility methods
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health/');
      return response.data;
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get media URL helper
  getMediaUrl(relativePath?: string): string {
    if (!relativePath) return '';

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';

    // Handle absolute URLs
    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    // Handle relative paths
    if (relativePath.startsWith('/')) {
      return `${baseUrl}${relativePath}`;
    }

    return `${baseUrl}/media/${relativePath}`;
  }

  // Search across both apartments and builders
  async globalSearch(query: string): Promise<{
    apartments: Apartment[];
    builders: Builder[];
  }> {
    const [apartmentsResponse, buildersResponse] = await Promise.all([
      this.getApartments({ search: query, page: 1 }),
      this.getBuilders({ search: query, page: 1 })
    ]);

    return {
      apartments: apartmentsResponse.results,
      builders: buildersResponse.results
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;