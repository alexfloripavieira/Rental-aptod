import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import ApartmentListPage from './pages/ApartmentList/ApartmentListPage';
import BuilderListPage from './pages/BuilderList/BuilderListPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            {/* Home route - redirect to apartments */}
            <Route path="/" element={<Navigate to="/aptos" replace />} />

            {/* Main routes */}
            <Route path="/aptos" element={<ApartmentListPage />} />
            <Route path="/builders" element={<BuilderListPage />} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
