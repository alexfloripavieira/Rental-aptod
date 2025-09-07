---
status: pending
parallelizable: false
blocked_by: ["3.0"]
unblocks: ["6.0"]
---

<task_context>
<domain>frontend/foundation</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 5.0: Setup React SPA Foundation

## Visão Geral

Configurar base sólida para aplicação React Single Page Application com TypeScript, Tailwind CSS, React Router, e API client, estabelecendo arquitetura e padrões que serão utilizados em todo o desenvolvimento frontend.

<requirements>
- React 18+ com TypeScript configurado
- Tailwind CSS 3+ implementado
- React Router para navegação SPA
- Axios configurado como HTTP client
- Estrutura de pastas organizada e escalável
- ESLint + Prettier configurados
- Vite como build tool otimizado
- Environment variables para diferentes ambientes
</requirements>

## Subtarefas

- [ ] 5.1 Inicializar projeto React com TypeScript
- [ ] 5.2 Configurar Tailwind CSS e design system base
- [ ] 5.3 Implementar React Router e estrutura de rotas
- [ ] 5.4 Configurar Axios e API client service
- [ ] 5.5 Criar interfaces TypeScript para API data
- [ ] 5.6 Configurar ESLint, Prettier e build tools
- [ ] 5.7 Implementar error boundaries e loading states
- [ ] 5.8 Configurar environment variables

## Detalhes de Implementação

### Project Structure:

```
frontend/
├── public/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base UI
│   │   ├── layout/         # Layout components
│   │   └── common/         # Componentes comuns
│   ├── pages/              # Páginas/rotas principais
│   │   ├── ApartmentList/
│   │   ├── BuilderList/
│   │   └── NotFound/
│   ├── services/           # API clients e serviços
│   ├── types/              # TypeScript interfaces
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Funções utilitárias
│   └── styles/             # CSS e Tailwind config
├── package.json
└── vite.config.ts
```

### TypeScript Interfaces (conforme techspec.md):

```typescript
// src/types/api.ts
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
}
```

### API Client Service:

```typescript
// src/services/api.ts
import axios, { AxiosInstance } from 'axios';
import { Apartment, Builder, PaginatedResponse, ApartmentFilters } from '../types/api';

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

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

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

  async getBuilders(): Promise<PaginatedResponse<Builder>> {
    const response = await this.client.get<PaginatedResponse<Builder>>('/builders/');
    return response.data;
  }

  async getBuilder(id: number): Promise<Builder> {
    const response = await this.client.get<Builder>(`/builders/${id}/`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### React Router Setup:

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ApartmentListPage } from './pages/ApartmentList/ApartmentListPage';
import { BuilderListPage } from './pages/BuilderList/BuilderListPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ApartmentListPage />} />
            <Route path="/aptos" element={<ApartmentListPage />} />
            <Route path="/builders" element={<BuilderListPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
```

### Tailwind Configuration:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode
}
```

### Error Boundary Component:

```typescript
// src/components/common/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Algo deu errado
            </h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Environment Configuration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios']
        }
      }
    }
  }
});
```

## Critérios de Sucesso

- Projeto React inicializado e buildando sem erros
- TypeScript strict mode ativado e sem erros
- Tailwind CSS funcionando com tema base configurado
- React Router navegando entre rotas `/aptos` e `/builders`
- API client fazendo requests para Django backend
- ESLint/Prettier configurados e rodando
- Error boundaries capturando erros adequadamente
- Hot reload funcionando em desenvolvimento
- Build production gerando bundle otimizado (<500KB)
- Environment variables funcionando para diferentes ambientes
- Vite dev server proxy funcionando com Django
- Dark mode toggle preparado (classe CSS)