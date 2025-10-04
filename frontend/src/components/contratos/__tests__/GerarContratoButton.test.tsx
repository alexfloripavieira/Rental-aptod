import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GerarContratoButton } from '../GerarContratoButton';
import * as AuthContext from '../../../contexts/AuthContext';

vi.mock('../../../contexts/AuthContext');

describe('GerarContratoButton', () => {
  it('deve renderizar botão para super admin', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { username: 'admin', isSuperuser: true },
      loading: false,
      authLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    const onOpenModal = vi.fn();

    render(<GerarContratoButton onOpenModal={onOpenModal} />);

    const button = screen.getByRole('button', { name: /gerar contrato de locação/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Gerar Contrato');
  });

  it('não deve renderizar para usuário comum', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { username: 'user', isSuperuser: false },
      loading: false,
      authLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    const onOpenModal = vi.fn();

    render(<GerarContratoButton onOpenModal={onOpenModal} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('deve chamar onOpenModal ao clicar', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { username: 'admin', isSuperuser: true },
      loading: false,
      authLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    const onOpenModal = vi.fn();

    render(<GerarContratoButton onOpenModal={onOpenModal} />);

    const button = screen.getByRole('button', { name: /gerar contrato de locação/i });
    fireEvent.click(button);

    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });

  it('deve ter tooltip correto', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { username: 'admin', isSuperuser: true },
      loading: false,
      authLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });

    const onOpenModal = vi.fn();

    render(<GerarContratoButton onOpenModal={onOpenModal} />);

    const button = screen.getByRole('button', { name: /gerar contrato de locação/i });
    expect(button).toHaveAttribute('title', 'Gerar Contrato de Locação');
  });
});
