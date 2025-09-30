import React, { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, authLoading } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleInquilinosClick = (e: React.MouseEvent) => {
    if (!user?.isSuperuser) {
      e.preventDefault();
      navigate('/inquilinos');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
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
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Seu Aluguel Fácil</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/aptos"
                className={`${
                  isActive('/aptos')
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                } px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Apartamentos
              </Link>
              <Link
                to="/builders"
                className={`${
                  isActive('/builders')
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                } px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Empreendimentos
              </Link>
              <Link
                to="/inquilinos"
                onClick={handleInquilinosClick}
                className={`${
                  isActive('/inquilinos')
                    ? 'text-primary-600 border-primary-600'
                    : user?.isSuperuser
                      ? 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                      : 'text-gray-400 border-transparent cursor-pointer hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                } px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Inquilinos
                {!user?.isSuperuser && (
                  <span className="ml-1 text-xs">🔒</span>
                )}
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {user?.isSuperuser && (
                <button
                  onClick={logout}
                  disabled={authLoading}
                  className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded"
                >
                  {authLoading ? 'Saindo...' : `Sair (${user.username})`}
                </button>
              )}

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
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 dark:bg-gray-800">
            <Link
              to="/aptos"
              className={`${
                isActive('/aptos')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Apartamentos
            </Link>
            <Link
              to="/builders"
              className={`${
                isActive('/builders')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Empreendimentos
            </Link>
            <Link
              to="/inquilinos"
              onClick={handleInquilinosClick}
              className={`${
                isActive('/inquilinos')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : user?.isSuperuser
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100'
                    : 'border-transparent text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Inquilinos
              {!user?.isSuperuser && (
                <span className="ml-1 text-xs">🔒</span>
              )}
            </Link>
            {user?.isSuperuser && (
              <button
                onClick={logout}
                disabled={authLoading}
                className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {authLoading ? 'Saindo...' : `Sair (${user.username})`}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto text-gray-600 dark:text-gray-300">
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
                <span className="font-semibold text-gray-900">Seu Aluguel Fácil</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sistema de gerenciamento de aluguel de apartamentos.
                Encontre o apartamento perfeito para você.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Links Úteis</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/aptos" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Apartamentos
                  </Link>
                </li>
                <li>
                  <Link to="/builders" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Empreendimentos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/inquilinos"
                    onClick={handleInquilinosClick}
                    className={`transition-colors ${
                      user?.isSuperuser
                        ? 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                        : 'text-gray-400 dark:text-gray-600 cursor-pointer hover:text-gray-500 dark:hover:text-gray-500'
                    }`}
                  >
                    Inquilinos {!user?.isSuperuser && '🔒'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Contato</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>📧 contato@aptos.com</p>
                <p>📱 (48) 9999-9999</p>
                <p>📍 Florianópolis, SC</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Aptos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
