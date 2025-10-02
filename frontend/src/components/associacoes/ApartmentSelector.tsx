import React, { useState } from 'react';

interface Apartamento {
  id: number;
  unit_number: string;
  building_name: string;
  floor?: string;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  square_footage: number;
  is_available: boolean;
}

interface ApartmentSelectorProps {
  apartamentos: Apartamento[];
  loading: boolean;
  value?: number;
  onChange: (apartamentoId: number) => void;
  onApartmentSelect: (apartamento: Apartamento) => void;
}

export function ApartmentSelector({
  apartamentos,
  loading,
  value,
  onChange,
  onApartmentSelect
}: ApartmentSelectorProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredApartamentos = apartamentos.filter(apt =>
    apt.unit_number.toLowerCase().includes(search.toLowerCase()) ||
    apt.building_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedApartment = apartamentos.find(apt => apt.id === value);

  const handleSelect = (apartamento: Apartamento) => {
    onChange(apartamento.id);
    onApartmentSelect(apartamento);
    setShowDropdown(false);
    setSearch('');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="relative border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer bg-white dark:bg-gray-700"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="flex items-center px-3 py-2">
          <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div className="flex-1">
            {selectedApartment ? (
              <span className="text-gray-900 dark:text-gray-100">
                {selectedApartment.unit_number} - {selectedApartment.building_name}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                Selecione um apartamento...
              </span>
            )}
          </div>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar apartamento..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredApartamentos.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                Nenhum apartamento encontrado
              </div>
            ) : (
              filteredApartamentos.map((apartamento) => (
                <div
                  key={apartamento.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !apartamento.is_available ? 'opacity-50' : ''
                  }`}
                  onClick={() => apartamento.is_available && handleSelect(apartamento)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {apartamento.unit_number}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {apartamento.building_name}
                        {apartamento.floor && ` • Andar ${apartamento.floor}`}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>{apartamento.number_of_bedrooms}Q • {apartamento.number_of_bathrooms}B</p>
                      <p>{apartamento.square_footage}m²</p>
                    </div>
                  </div>
                  {!apartamento.is_available && (
                    <p className="text-xs text-red-500 mt-1">Indisponível</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
