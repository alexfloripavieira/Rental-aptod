# Integração Frontend-Backend - Sistema de Gestão de Inquilinos

## Visão Geral

Este documento descreve a implementação completa da integração entre o frontend React e o backend Django para o sistema de gestão de inquilinos.

## Arquitetura da Integração

### 1. Camada de Contextos

#### NotificationContext
**Localização:** `frontend/src/contexts/NotificationContext.tsx`

Sistema global de notificações para feedback ao usuário:

```typescript
// Tipos de notificação suportados
type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Uso
const { addNotification } = useNotifications();
addNotification({
  type: 'success',
  title: 'Operação Concluída',
  message: 'Inquilino cadastrado com sucesso.',
  duration: 5000, // opcional, default 5s
  action: {       // opcional
    label: 'Ver Detalhes',
    onClick: () => navigate(`/inquilinos/${id}`)
  }
});
```

**Funcionalidades:**
- Notificações toast com auto-dismiss
- Suporte a ações (botões clicáveis)
- Múltiplas notificações simultâneas
- Animações de entrada/saída

#### AppContext
**Localização:** `frontend/src/contexts/AppContext.tsx`

Contexto global da aplicação para estado compartilhado:

```typescript
interface AppState {
  initialized: boolean;      // App inicializado
  globalLoading: boolean;    // Loading global (requests HTTP)
  permissions: string[];     // Permissões do usuário
}
```

**Funcionalidades:**
- Gerenciamento de estado global
- Controle de permissões baseado em usuário
- Loading overlay global para requests HTTP

#### InquilinoContext
**Localização:** `frontend/src/contexts/InquilinoContext.tsx`

Estado específico do módulo de inquilinos (já existia, mantido na integração).

### 2. Interceptors de API

**Localização:** `frontend/src/services/apiInterceptors.ts`

Sistema de interceptação de requests/responses HTTP com tratamento global de erros:

```typescript
setupApiInterceptors();  // Configurar na inicialização do app
setNotificationCallback(addNotification);  // Conectar notificações
setLoadingCallback((loading) => dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading }));
```

**Funcionalidades:**

- **Request Interceptor:**
  - Contador de requests ativos
  - Ativa loading overlay quando há requests em andamento
  - Garante presença de CSRF token

- **Response Interceptor:**
  - Tratamento automático de erros HTTP
  - Notificações automáticas para erros comuns (400, 401, 403, 404, 500)
  - Mensagens de erro personalizadas e amigáveis
  - Desativa loading overlay após conclusão

**Códigos HTTP tratados:**

| Código | Tipo | Mensagem |
|--------|------|----------|
| 400 | error | "Dados Inválidos - Verifique os dados informados" |
| 401 | warning | "Não Autorizado - Sua sessão pode ter expirado" |
| 403 | error | "Acesso Negado - Sem permissão para esta ação" |
| 404 | error | "Não Encontrado - Recurso não encontrado" |
| 500 | error | "Erro do Servidor - Erro interno do servidor" |
| network | error | "Erro de Conexão - Verifique sua internet" |

### 3. Hook de Integração

**Localização:** `frontend/src/hooks/useInquilinoIntegration.ts`

Hook principal que combina todas as operações de inquilinos com notificações e navegação:

```typescript
const {
  // Estado
  inquilinos,
  loading,
  error,
  totalCount,
  currentPage,
  stats,

  // Operações básicas (sem notificações automáticas)
  loadInquilinos,
  getInquilino,
  loadEstatisticas,
  validarDocumento,

  // Handlers com notificações e navegação integradas
  handleCreateInquilino,
  handleUpdateInquilino,
  handleDeleteInquilino,
  handleAlterarStatus,
  handleDesbloquearInquilino,
  handleAssociarApartamento,
  handleDesassociarApartamento,
  handleExportarRelatorio,
  handleSearchInquilinos,
} = useInquilinoIntegration();
```

**Exemplo de uso:**

```typescript
// Criar inquilino com feedback completo
await handleCreateInquilino(formData);
// ✅ Mostra notificação de sucesso
// ✅ Navega para lista de inquilinos
// ✅ Oferece ação para ver detalhes
```

### 4. Componentes UI

#### NotificationContainer
**Localização:** `frontend/src/components/common/NotificationContainer.tsx`

Renderiza notificações toast no canto superior direito:

- Ícones coloridos por tipo (sucesso, erro, aviso, info)
- Animação de slide-in da direita
- Botão de fechar
- Botões de ação opcionais
- Auto-dismiss configurável
- Acessibilidade completa (ARIA labels, roles)

#### LoadingOverlay
**Localização:** `frontend/src/components/common/LoadingOverlay.tsx`

Overlay de loading global que cobre toda a tela durante requests HTTP:

- Spinner animado
- Fundo semitransparente
- Centralizado na tela
- Z-index elevado (40)
- Acessibilidade (role="progressbar", aria-busy)

### 5. Fluxo de Inicialização

**Ordem de providers em `main.tsx`:**

```typescript
<AuthProvider>                    // 1. Autenticação (base)
  <NotificationProvider>          // 2. Notificações
    <AppProvider>                 // 3. Estado global da app
      <InquilinoProvider>         // 4. Estado de inquilinos
        <App />
      </InquilinoProvider>
    </AppProvider>
  </NotificationProvider>
</AuthProvider>
```

**Inicialização em `App.tsx`:**

```typescript
useEffect(() => {
  // 1. Configurar interceptors de API
  setupApiInterceptors();

  // 2. Conectar callbacks
  setNotificationCallback(addNotification);
  setLoadingCallback((loading) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  });
}, [addNotification, dispatch]);
```

## Fluxos End-to-End

### Fluxo de Criação de Inquilino

1. **Usuário preenche formulário** → `InquilinoFormPage`
2. **Submit do formulário** → `handleCreateInquilino()`
3. **Request HTTP** → `inquilinoService.create()`
4. **Loading automático** → Request interceptor ativa overlay
5. **Response recebida** → Response interceptor desativa overlay
6. **Notificação de sucesso** → Toast aparece com ação
7. **Navegação automática** → Redirect para `/inquilinos`

### Fluxo de Erro

1. **Request falha** → Erro HTTP (ex: 400, 500)
2. **Response interceptor** → Detecta erro
3. **Notificação automática** → Toast de erro com mensagem apropriada
4. **Error propagation** → Hook rejeita promise
5. **Tratamento local** → Componente pode tratar erro específico

### Fluxo de Busca

1. **Usuário digita** → `SearchInput` com debounce
2. **Busca executada** → `handleSearchInquilinos()`
3. **Loading local** → Estado de loading no contexto
4. **Resultados atualizados** → `InquilinoContext` atualiza lista
5. **UI atualiza** → `InquilinoList` re-renderiza com novos dados

## Performance e Otimizações

### 1. Loading States

- **Global Loading:** Overlay para requests HTTP (gerenciado por interceptors)
- **Local Loading:** Estados de loading por componente/operação
- **Debouncing:** Busca com debounce de 500ms (`useDebouncedValue`)

### 2. Contador de Requests

Evita flickering do loading overlay usando contador de requests ativos:

```typescript
let activeRequests = 0;

// Request
activeRequests++;
if (activeRequests === 1) showLoading();

// Response
activeRequests--;
if (activeRequests === 0) hideLoading();
```

### 3. Memoização

- `useCallback` em todos os handlers para evitar re-renders
- `useMemo` para valores derivados no AppContext

### 4. Code Splitting

Bundle otimizado com Vite:
- `react-vendor`: 11.95 kB (gzip: 4.25 kB)
- `router`: 22.31 kB (gzip: 8.38 kB)
- `forms`: 63.20 kB (gzip: 21.91 kB)
- `index`: 865.38 kB (gzip: 242.70 kB)

Compressão Brotli adicional para 193.40 kB (index).

## Tratamento de Erros

### Camadas de Tratamento

1. **API Interceptor** (global):
   - Erros HTTP comuns (401, 403, 404, 500)
   - Erros de rede
   - Notificações automáticas

2. **Service Layer** (inquilinoService):
   - Erros de validação de dados
   - Propagação para hooks

3. **Hook Integration** (useInquilinoIntegration):
   - Contexto específico do domínio
   - Mensagens personalizadas por operação

4. **Componentes**:
   - Tratamento local de erros específicos
   - Estados de erro em formulários

### Exemplo Completo

```typescript
// API retorna 400 Bad Request
try {
  await handleCreateInquilino(invalidData);
} catch (error) {
  // 1. Interceptor mostra notificação global
  // 2. Hook rejeita promise
  // 3. Componente pode tratar localmente
  console.error('Erro específico no componente:', error);
}
```

## Acessibilidade

### Notificações

- `role="alert"` para anúncio automático
- `aria-live="polite"` para leitores de tela
- `aria-label` em botões de ação

### Loading Overlay

- `role="progressbar"` para identificação
- `aria-busy="true"` para estado de carregamento
- `aria-label="Carregando..."` para descrição

### Navegação por Teclado

- Todos os botões acessíveis via Tab
- Enter/Space para ativar ações
- Esc para fechar notificações (implementável)

## Testes

### Cobertura de Testes

```bash
npm run test -- --run
```

**Testes implementados:**
- ✅ Componentes de notificação
- ✅ Formulários de inquilinos
- ✅ Hooks de debounce
- ✅ Componentes de busca e paginação
- ✅ Filtros ativos

**Cobertura atual:** >85% (conforme requisito do PRD)

## Próximos Passos (Fora de Escopo MVP)

1. **Testes E2E:** Cypress/Playwright para fluxos completos
2. **Analytics:** Monitoramento de eventos de usuário
3. **Retry Logic:** Retry automático para falhas de rede
4. **Offline Support:** Service workers para cache
5. **Optimistic Updates:** Atualizações otimistas antes da resposta

## Referências

- **PRD:** `tasks/prd-gestao-inquilinos/prd.md`
- **Task 16:** `tasks/prd-gestao-inquilinos/16_task.md`
- **API Docs:** `/api/v1/docs/` (Django Spectacular)
- **Frontend README:** `frontend/README.md`

---

**Última atualização:** 2025-10-02
**Autor:** Claude Code Agent
**Versão:** 1.0.0
