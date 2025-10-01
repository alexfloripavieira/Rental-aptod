import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  describe('Com totalPages', () => {
    it('deve renderizar com totalPages', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText('Página 1 de 5')).toBeInTheDocument();
    });

    it('deve desabilitar botão anterior na primeira página', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      const prevButton = screen.getByLabelText('Página anterior');
      expect(prevButton).toBeDisabled();
    });

    it('deve desabilitar botão próximo na última página', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      const nextButton = screen.getByLabelText('Próxima página');
      expect(nextButton).toBeDisabled();
    });

    it('deve chamar onPageChange ao clicar em anterior', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      const prevButton = screen.getByLabelText('Página anterior');
      fireEvent.click(prevButton);

      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it('deve chamar onPageChange ao clicar em próxima', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      const nextButton = screen.getByLabelText('Próxima página');
      fireEvent.click(nextButton);

      expect(handlePageChange).toHaveBeenCalledWith(4);
    });

    it('deve renderizar números de página quando showPageNumbers é true', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      expect(screen.getByLabelText('Página 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Página 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Página 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Página 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Página 5')).toBeInTheDocument();
    });

    it('deve marcar a página atual como selecionada', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const currentPageButton = screen.getByLabelText('Página 3');
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
      expect(currentPageButton).toBeDisabled();
    });

    it('deve chamar onPageChange ao clicar em número de página', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={handlePageChange}
          showPageNumbers={true}
        />
      );

      const page3Button = screen.getByLabelText('Página 3');
      fireEvent.click(page3Button);

      expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it('deve renderizar ellipsis para muitas páginas', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={20}
          onPageChange={vi.fn()}
          showPageNumbers={true}
          maxPageNumbers={5}
        />
      );

      const ellipsis = screen.getAllByText('...');
      expect(ellipsis.length).toBeGreaterThan(0);
    });
  });

  describe('Com hasNext/hasPrevious', () => {
    it('deve funcionar com hasNext e hasPrevious', () => {
      render(
        <Pagination
          currentPage={2}
          hasNext={true}
          hasPrevious={true}
          onPageChange={vi.fn()}
        />
      );

      const prevButton = screen.getByLabelText('Página anterior');
      const nextButton = screen.getByLabelText('Próxima página');

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('deve desabilitar botão anterior quando hasPrevious é false', () => {
      render(
        <Pagination
          currentPage={1}
          hasNext={true}
          hasPrevious={false}
          onPageChange={vi.fn()}
        />
      );

      const prevButton = screen.getByLabelText('Página anterior');
      expect(prevButton).toBeDisabled();
    });

    it('deve desabilitar botão próximo quando hasNext é false', () => {
      render(
        <Pagination
          currentPage={5}
          hasNext={false}
          hasPrevious={true}
          onPageChange={vi.fn()}
        />
      );

      const nextButton = screen.getByLabelText('Próxima página');
      expect(nextButton).toBeDisabled();
    });
  });
});
