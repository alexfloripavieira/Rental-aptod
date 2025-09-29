import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../common/Loading';

interface RequireSuperuserProps {
  children: React.ReactNode;
}

export function RequireSuperuser({ children }: RequireSuperuserProps) {
  const { user, loading, authLoading, login, error } = useAuth();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await login(credentials.username.trim(), credentials.password);
    } catch (err: any) {
      setFormError(err?.message || 'Não foi possível autenticar.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!user?.isSuperuser) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Acesso restrito
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Esta área é exclusiva para administradores. Faça login com as credenciais de superusuário.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuário
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={credentials.username}
              onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {(formError || error) && (
            <p className="text-sm text-red-600">{formError || error}</p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {authLoading ? 'Autenticando...' : 'Entrar como superusuário'}
          </button>
        </form>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Dica: você pode acessar diretamente <a className="text-blue-600 dark:text-blue-400" href={`${window.location.protocol}//${window.location.hostname}:8000/admin/login/?next=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noreferrer">o login do Django Admin</a> se preferir.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
