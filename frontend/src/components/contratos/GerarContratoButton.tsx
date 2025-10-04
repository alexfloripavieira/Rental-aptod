import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface GerarContratoButtonProps {
  onOpenModal: () => void;
}

export function GerarContratoButton({ onOpenModal }: GerarContratoButtonProps) {
  const { user } = useAuth();

  if (!user?.isSuperuser) {
    return null;
  }

  return (
    <button
      onClick={onOpenModal}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      title="Gerar Contrato de Locação"
      aria-label="Gerar contrato de locação"
    >
      Gerar Contrato
    </button>
  );
}
