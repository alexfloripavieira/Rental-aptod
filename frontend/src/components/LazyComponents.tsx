/**
 * Lazy loading de componentes para otimização de performance
 *
 * Este arquivo centraliza todos os componentes que devem ser carregados sob demanda
 * para reduzir o tamanho do bundle inicial e melhorar o tempo de carregamento.
 */
import { lazy, Suspense, ComponentType, ReactNode } from 'react';

// Componente de loading genérico
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy loading dos componentes principais de inquilinos
export const InquilinoList = lazy(() =>
  import('./inquilinos/InquilinoList').then(module => ({ default: module.InquilinoList }))
);

export const InquilinoForm = lazy(() =>
  import('./inquilinos/InquilinoForm').then(module => ({ default: module.InquilinoForm }))
);

export const InquilinoCard = lazy(() =>
  import('./inquilinos/InquilinoCard').then(module => ({ default: module.InquilinoCard }))
);

export const InquilinoFilters = lazy(() =>
  import('./inquilinos/InquilinoFilters').then(module => ({ default: module.InquilinoFilters }))
);

// Lazy loading das páginas de detalhes
export const InquilinoDetailPage = lazy(() =>
  import('../pages/InquilinoDetail/InquilinoDetailPage')
);

// Lazy loading dos componentes de dashboard (se existirem)
export const Dashboard = lazy(() =>
  import('./dashboard/Dashboard').catch(() => ({ default: () => <div>Dashboard em desenvolvimento</div> }))
);

// Lazy loading de componentes de associação
export const AssociacaoForm = lazy(() =>
  import('./associacoes/AssociacaoForm').catch(() => ({ default: () => <div>Carregando...</div> }))
);

export const AssociacaoList = lazy(() =>
  import('./associacoes/AssociacaoList').catch(() => ({ default: () => <div>Carregando...</div> }))
);

/**
 * Wrapper com Suspense para componentes lazy
 *
 * @param children - Componente lazy a ser renderizado
 * @param fallback - Componente de loading customizado (opcional)
 */
interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyComponent({ children, fallback }: LazyComponentProps) {
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
}

/**
 * HOC para criar componentes lazy com Suspense
 *
 * @param Component - Componente a ser carregado lazily
 * @param fallback - Componente de loading customizado
 */
export function withLazy<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Loading customizado para tabelas/listas
export const TableLoadingFallback = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Loading customizado para formulários
export const FormLoadingFallback = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="space-y-3">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-10 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);
