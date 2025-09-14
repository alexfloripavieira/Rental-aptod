import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          {/* 404 Number */}
          <div className="text-9xl font-bold text-primary-600 mb-4">
            404
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Página não encontrada
          </h1>

          <p className="text-gray-600 mb-8">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-4">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01"
              />
            </svg>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Voltar ao início
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/aptos"
              className="flex-1 btn-secondary"
            >
              Ver apartamentos
            </Link>
            <Link
              to="/builders"
              className="flex-1 btn-secondary"
            >
              Ver Empreendimentos
            </Link>
          </div>
        </div>

        {/* Additional help */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Precisa de ajuda? Aqui estão algumas páginas úteis:
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              to="/aptos"
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              Apartamentos
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/builders"
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              Empreendimentos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;