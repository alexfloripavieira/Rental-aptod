import React from 'react';
import { useApp } from '../../contexts/AppContext';

export function LoadingOverlay() {
  const { state } = useApp();

  if (!state.globalLoading) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-25 z-40 flex items-center justify-center"
      role="progressbar"
      aria-label="Carregando..."
      aria-busy="true"
    >
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-3">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="text-gray-700 font-medium">Carregando...</p>
      </div>
    </div>
  );
}
