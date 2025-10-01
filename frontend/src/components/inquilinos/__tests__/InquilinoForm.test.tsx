import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InquilinoForm } from '../InquilinoForm';
import type { DocumentoUpload, InquilinoFormData } from '../../../types/inquilino';
import { FormProvider, useForm } from 'react-hook-form';
import { DadosBasicos } from '../steps/DadosBasicos';

const mockValidateDocument = vi.fn();

vi.mock('../../../hooks/useCpfCnpjValidation', () => ({
  useCpfCnpjValidation: () => ({
    validateDocument: mockValidateDocument,
    isValidating: false,
  }),
}));

vi.mock('../steps/DocumentosUpload', () => ({
  DocumentosUpload: ({ documentos, onDocumentosChange }: { documentos: DocumentoUpload[]; onDocumentosChange: (docs: DocumentoUpload[]) => void }) => (
    <div>
      <p data-testid="documentos-count">{documentos.length}</p>
      <button
        type="button"
        onClick={() => {
          const file = new File(['teste'], 'documento.pdf', { type: 'application/pdf' });
          onDocumentosChange([
            ...documentos,
            {
              file,
              tipo: 'OUTROS',
            } as DocumentoUpload,
          ]);
        }}
      >
        Adicionar documento de teste
      </button>
    </div>
  )
}));

describe('InquilinoForm', () => {
  beforeEach(() => {
    mockValidateDocument.mockResolvedValue({ valid: true, formatted: '390.533.447-05', exists: false });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('restores saved draft from localStorage', async () => {
    window.localStorage.setItem(
      'inquilino-draft',
      JSON.stringify({
        tipo: 'PF',
        nome_completo: 'Maria da Silva',
        email: 'maria@example.com',
        telefone: '(11) 91234-5678',
      })
    );

    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    const nomeInput = await screen.findByLabelText('Nome Completo') as HTMLInputElement;
    expect(nomeInput.value).toBe('Maria da Silva');

    expect(screen.getByText(/rascunho foi carregado automaticamente/i)).toBeDefined();
  });

  it('passes uploaded documents when submitting the form', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <InquilinoForm
        onSubmit={handleSubmit}
        onCancel={() => undefined}
      />
    );

    const nomeCompleto = await screen.findByLabelText('Nome Completo');
    await user.type(nomeCompleto, 'João da Silva');
    await user.type(await screen.findByLabelText('CPF'), '39053344705');
    await user.type(screen.getByLabelText('Email'), 'joao@example.com');
    await user.type(screen.getByLabelText('Telefone'), '11987654321');

    await user.click(screen.getByRole('button', { name: /próximo/i }));
    await user.click(screen.getByRole('button', { name: /próximo/i }));

    await user.click(screen.getByRole('button', { name: /Adicionar documento de teste/i }));
    expect(screen.getByTestId('documentos-count').textContent).toBe('1');

    await user.click(screen.getByRole('button', { name: /próximo/i }));
    await user.click(screen.getByRole('button', { name: /Criar Inquilino/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const [data, documentos] = handleSubmit.mock.calls[0];
    expect(data.nome_completo).toBe('João da Silva');
    expect(documentos).toHaveLength(1);
    expect(documentos[0].file.name).toBe('documento.pdf');
  });

  it('renders form with correct initial step', () => {
    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    expect(screen.getByText('Dados Básicos do Inquilino')).toBeDefined();
    expect(screen.getByLabelText('Tipo')).toBeDefined();
  });

  it('allows navigation between steps', async () => {
    const user = userEvent.setup();

    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    const nomeCompleto = await screen.findByLabelText('Nome Completo');
    await user.type(nomeCompleto, 'João da Silva');
    await user.type(await screen.findByLabelText('CPF'), '39053344705');
    await user.type(screen.getByLabelText('Email'), 'joao@example.com');
    await user.type(screen.getByLabelText('Telefone'), '11987654321');

    await user.click(screen.getByRole('button', { name: /próximo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Endereço \(Opcional\)/i)).toBeDefined();
    });

    await user.click(screen.getByRole('button', { name: /anterior/i }));

    await waitFor(() => {
      expect(screen.getByText('Dados Básicos do Inquilino')).toBeDefined();
    });
  });

  it('switches fields when tipo changes from PF to PJ', async () => {
    const user = userEvent.setup();

    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    expect(screen.getByLabelText('Nome Completo')).toBeDefined();

    const tipoSelect = screen.getByLabelText('Tipo');
    await user.selectOptions(tipoSelect, 'PJ');

    await waitFor(() => {
      expect(screen.getByLabelText('Razão Social')).toBeDefined();
      expect(screen.queryByLabelText('Nome Completo')).toBeNull();
    });
  });

  it('validates required fields before allowing navigation', async () => {
    const user = userEvent.setup();

    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    await user.click(screen.getByRole('button', { name: /próximo/i }));

    await waitFor(() => {
      expect(screen.getByText('Dados Básicos do Inquilino')).toBeDefined();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();

    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={handleCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('clears draft when discard button is clicked', async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      'inquilino-draft',
      JSON.stringify({
        tipo: 'PF',
        nome_completo: 'Test User',
        email: 'test@example.com',
        telefone: '(11) 91234-5678',
      })
    );

    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    expect(screen.getByText(/rascunho foi carregado automaticamente/i)).toBeDefined();

    const discardButtons = screen.getAllByRole('button', { name: /descartar rascunho/i });
    await user.click(discardButtons[0]);

    await waitFor(() => {
      expect(window.localStorage.getItem('inquilino-draft')).toBeNull();
    });
  });

  it('loads initial data for editing mode', () => {
    const initialData: Partial<InquilinoFormData> = {
      tipo: 'PF',
      nome_completo: 'João da Silva',
      cpf: '390.533.447-05',
      email: 'joao@example.com',
      telefone: '(11) 98765-4321',
    };

    render(
      <InquilinoForm
        initialData={initialData}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
        isEditing
      />
    );

    const nomeInput = screen.getByLabelText('Nome Completo') as HTMLInputElement;
    expect(nomeInput.value).toBe('João da Silva');
  });
});

describe('DadosBasicos', () => {
  it('exibe mensagem de erro quando documento é inválido', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    mockValidateDocument.mockReset();
    mockValidateDocument.mockResolvedValue({ valid: true, formatted: '123.456.789-00', exists: false });
    mockValidateDocument.mockResolvedValueOnce({ valid: false, error: 'CPF inválido' });

    const Wrapper = () => {
      const methods = useForm({
        defaultValues: {
          tipo: 'PF',
          email: '',
          telefone: '',
        },
        mode: 'onChange',
      });

      return (
        <FormProvider {...methods}>
          <DadosBasicos />
        </FormProvider>
      );
    };

    try {
      render(<Wrapper />);

      await user.type(await screen.findByLabelText('CPF'), '12345678901');
      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText('CPF inválido')).toBeDefined();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('exibe mensagem quando CPF já existe no sistema', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    mockValidateDocument.mockReset();
    mockValidateDocument.mockResolvedValueOnce({
      valid: true,
      exists: true,
      existingInquilino: {
        id: 1,
        nome: 'Usuário Existente',
        status: 'ATIVO' as const,
      },
    });

    const Wrapper = () => {
      const methods = useForm({
        defaultValues: {
          tipo: 'PF',
          email: '',
          telefone: '',
        },
        mode: 'onChange',
      });

      return (
        <FormProvider {...methods}>
          <DadosBasicos />
        </FormProvider>
      );
    };

    try {
      render(<Wrapper />);

      await user.type(await screen.findByLabelText('CPF'), '39053344705');
      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/CPF já cadastrado para Usuário Existente/i)).toBeDefined();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears PF fields when switching to PJ', async () => {
    const user = userEvent.setup();

    const Wrapper = () => {
      const methods = useForm({
        defaultValues: {
          tipo: 'PF',
          nome_completo: 'João Silva',
          cpf: '390.533.447-05',
          email: '',
          telefone: '',
        },
        mode: 'onChange',
      });

      return (
        <FormProvider {...methods}>
          <DadosBasicos />
        </FormProvider>
      );
    };

    render(<Wrapper />);

    expect(screen.getByLabelText('Nome Completo')).toBeDefined();

    const tipoSelect = screen.getByLabelText('Tipo');
    await user.selectOptions(tipoSelect, 'PJ');

    await waitFor(() => {
      expect(screen.getByLabelText('Razão Social')).toBeDefined();
      expect(screen.queryByLabelText('Nome Completo')).toBeNull();
    });
  });
});
