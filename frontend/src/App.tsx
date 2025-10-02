import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import ApartmentListPage from './pages/ApartmentList/ApartmentListPage';
import BuilderListPage from './pages/BuilderList/BuilderListPage';
import BuilderDetailPage from './pages/BuilderDetail/BuilderDetailPage';
import ApartmentDetailPage from './pages/ApartmentDetail/ApartmentDetailPage';
import InquilinosListPage from './pages/InquilinosList/InquilinosListPage';
import { InquilinoFormPage } from './pages/InquilinoForm/InquilinoFormPage';
import InquilinoDetailPage from './pages/InquilinoDetail/InquilinoDetailPage';
import { Dashboard } from './pages/Dashboard';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import RelatoriosPage from './pages/Relatorios/RelatoriosPage';
import { RequireSuperuser } from './components/auth/RequireSuperuser';
import { AssociacaoManager } from './components/associacoes/AssociacaoManager';
import { NotificationContainer } from './components/common/NotificationContainer';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { setupApiInterceptors, setNotificationCallback, setLoadingCallback } from './services/apiInterceptors';
import { useNotifications } from './contexts/NotificationContext';
import { useApp } from './contexts/AppContext';

const App: React.FC = () => {
  const { addNotification } = useNotifications();
  const { dispatch } = useApp();

  useEffect(() => {
    // Configurar interceptors de API
    setupApiInterceptors();

    // Configurar callbacks para notificações e loading
    setNotificationCallback(addNotification);
    setLoadingCallback((loading: boolean) => {
      dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
    });
  }, [addNotification, dispatch]);

  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            {/* Home route - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={(
                <RequireSuperuser>
                  <Dashboard />
                </RequireSuperuser>
              )}
            />

            {/* Main routes */}
            <Route path="/aptos" element={<ApartmentListPage />} />
            <Route path="/aptos/:id" element={<ApartmentDetailPage />} />
            <Route path="/builders" element={<BuilderListPage />} />
            <Route path="/builders/:id" element={<BuilderDetailPage />} />
            <Route
              path="/relatorios"
              element={(
                <RequireSuperuser>
                  <RelatoriosPage />
                </RequireSuperuser>
              )}
            />

            {/* Inquilinos routes */}
            <Route
              path="/inquilinos"
              element={(
                <RequireSuperuser>
                  <InquilinosListPage />
                </RequireSuperuser>
              )}
            />
            <Route
              path="/inquilinos/novo"
              element={(
                <RequireSuperuser>
                  <InquilinoFormPage />
                </RequireSuperuser>
              )}
            />
            <Route
              path="/inquilinos/:id"
              element={(
                <RequireSuperuser>
                  <InquilinoDetailPage />
                </RequireSuperuser>
              )}
            />
            <Route
              path="/inquilinos/:id/editar"
              element={(
                <RequireSuperuser>
                  <InquilinoFormPage />
                </RequireSuperuser>
              )}
            />
            <Route
              path="/inquilinos/:inquilinoId/associacoes"
              element={(
                <RequireSuperuser>
                  <AssociacaoManager />
                </RequireSuperuser>
              )}
            />

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <NotificationContainer />
          <LoadingOverlay />
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
