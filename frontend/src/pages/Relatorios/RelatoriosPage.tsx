import React, { useState } from 'react';
import { relatorioService } from '../../services/relatorioService';

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleDownload = async (tipo: 'inquilinos_ativos' | 'ocupacao' | 'inadimplentes', formato: 'pdf' | 'excel' = 'pdf') => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (formato === 'pdf') {
        await relatorioService.downloadPDF(tipo, {});
      } else {
        await relatorioService.downloadExcel(tipo, {});
      }
      setMessage('Relatório gerado com sucesso. O download foi iniciado.');
    } catch (err: any) {
      setError(err?.message || 'Falha ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Relatórios</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Gere relatórios em PDF ou Excel.</p>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-200">{error}</div>
          )}
          {message && (
            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-200">{message}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">Inquilinos Ativos</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Lista de inquilinos com locação ativa.</p>
              <div className="flex gap-2">
                <button disabled={loading} onClick={() => handleDownload('inquilinos_ativos','pdf')} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">PDF</button>
                <button disabled={loading} onClick={() => handleDownload('inquilinos_ativos','excel')} className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Excel</button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">Ocupação</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Taxa de ocupação por mês.</p>
              <div className="flex gap-2">
                <button disabled={loading} onClick={() => handleDownload('ocupacao','pdf')} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">PDF</button>
                <button disabled={loading} onClick={() => handleDownload('ocupacao','excel')} className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Excel</button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">Inadimplentes</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Relação de inquilinos inadimplentes.</p>
              <div className="flex gap-2">
                <button disabled={loading} onClick={() => handleDownload('inadimplentes','pdf')} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">PDF</button>
                <button disabled={loading} onClick={() => handleDownload('inadimplentes','excel')} className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Excel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

