import React from 'react';
import { Link } from 'react-router-dom';

export function QuickActions() {
  const actions = [
    {
      title: 'Novo Inquilino',
      description: 'Cadastrar novo inquilino',
      icon: '➕',
      href: '/inquilinos/novo',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Buscar Inquilinos',
      description: 'Encontrar inquilinos existentes',
      icon: '🔍',
      href: '/inquilinos',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Relatórios',
      description: 'Gerar relatórios detalhados',
      icon: '📄',
      href: '/relatorios',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Apartamentos',
      description: 'Ver apartamentos disponíveis',
      icon: '🏢',
      href: '/aptos',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ações Rápidas</h3>
        <p className="text-sm text-gray-500 dark:text-gray-300">Acesso rápido às funcionalidades principais</p>
      </div>

      <div className="p-6 space-y-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all group"
          >
            <div
              className={`p-2 rounded-md ${action.color} text-white group-hover:scale-105 transition-transform`}
            >
              <span className="text-xl">{action.icon}</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
