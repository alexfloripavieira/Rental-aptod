import React from 'react';
import type { Builder } from '../../types/api';
import { BuilderCard } from './BuilderCard';

interface BuilderListProps {
  builders: Builder[];
}

export const BuilderList: React.FC<BuilderListProps> = ({ builders }) => {
  if (!builders || builders.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma construtora encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros de busca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {builders.map((builder) => (
        <BuilderCard key={builder.id} builder={builder} />
      ))}
    </div>
  );
};

export default BuilderList;
