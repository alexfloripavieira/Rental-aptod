import React from 'react';

interface PaginationProps {
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  hasNext,
  hasPrevious,
  onPageChange,
}) => {
  const goPrev = () => hasPrevious && onPageChange(currentPage - 1);
  const goNext = () => hasNext && onPageChange(currentPage + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={goPrev}
        disabled={!hasPrevious}
        className={`px-4 py-2 rounded border ${
          hasPrevious
            ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        aria-label="Página anterior"
      >
        Anterior
      </button>
      <span className="px-3 py-2 text-sm text-gray-600">Página {currentPage}</span>
      <button
        onClick={goNext}
        disabled={!hasNext}
        className={`px-4 py-2 rounded border ${
          hasNext
            ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </div>
  );
};

export default Pagination;

