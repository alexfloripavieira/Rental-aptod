import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
  showPageNumbers = false,
  maxPageNumbers = 5,
}) => {
  // Se totalPages não for fornecido, usa hasNext/hasPrevious
  const prev = totalPages ? currentPage > 1 : hasPrevious ?? false;
  const next = totalPages ? currentPage < totalPages : hasNext ?? false;

  const goPrev = () => prev && onPageChange(currentPage - 1);
  const goNext = () => next && onPageChange(currentPage + 1);
  const goToPage = (page: number) => onPageChange(page);

  // Gera array de números de página para exibir
  const getPageNumbers = () => {
    if (!totalPages || !showPageNumbers) return [];

    const pages: (number | string)[] = [];
    const halfRange = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, currentPage + halfRange);

    // Ajusta o range se estiver no início ou fim
    if (currentPage <= halfRange) {
      end = Math.min(totalPages, maxPageNumbers);
    }
    if (currentPage > totalPages - halfRange) {
      start = Math.max(1, totalPages - maxPageNumbers + 1);
    }

    // Adiciona primeira página e ellipsis se necessário
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    // Adiciona páginas do range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Adiciona ellipsis e última página se necessário
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Botão Anterior */}
      <button
        onClick={goPrev}
        disabled={!prev}
        className={`px-4 py-2 rounded-md border transition-colors ${
          prev
            ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
        }`}
        aria-label="Página anterior"
      >
        Anterior
      </button>

      {/* Números de página */}
      {showPageNumbers && pageNumbers.length > 0 ? (
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => goToPage(page as number)}
                disabled={isCurrentPage}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isCurrentPage
                    ? 'bg-blue-600 text-white cursor-default'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
                }`}
                aria-label={`Página ${page}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
          Página {currentPage}{totalPages ? ` de ${totalPages}` : ''}
        </span>
      )}

      {/* Botão Próxima */}
      <button
        onClick={goNext}
        disabled={!next}
        className={`px-4 py-2 rounded-md border transition-colors ${
          next
            ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
        }`}
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </div>
  );
};

export default Pagination;

