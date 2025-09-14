import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">Aptos</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/aptos"
                className={`${
                  isActive('/aptos')
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Apartamentos
              </Link>
              <Link
                to="/builders"
                className={`${
                  isActive('/builders')
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Empreendimentos
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
            <Link
              to="/aptos"
              className={`${
                isActive('/aptos')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Apartamentos
            </Link>
            <Link
              to="/builders"
              className={`${
                isActive('/builders')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Empreendimentos
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Aptos</span>
              </div>
              <p className="text-gray-600 text-sm">
                Sistema de gerenciamento de aluguel de apartamentos.
                Encontre o apartamento perfeito para você.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Links Úteis</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/aptos" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Apartamentos
                  </Link>
                </li>
                <li>
                  <Link to="/builders" className="text-gray-600 hover:text-primary-600 transition-colors">
                    Empreendimentos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contato</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📧 contato@aptos.com</p>
                <p>📱 (11) 9999-9999</p>
                <p>📍 São Paulo, SP</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Aptos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
