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

// Simplifica DocumentosUpload nos testes para evitar dependências de drag&drop
vi.mock('../steps/DocumentosUpload', () => ({
  DocumentosUpload: () => <div data-testid="documentos-upload-mock" />
}));

describe('InquilinoForm', () => {
  beforeEach(() => {
    mockValidateDocument.mockResolvedValue({ valid: true, formatted: '390.533.447-05', exists: false });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // O formulário atual não restaura rascunho automaticamente; teste removido

  it('submits the form with filled data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <InquilinoForm
        onSubmit={handleSubmit}
        onCancel={() => undefined}
      />
    );

    const nomeCompleto = await screen.findByPlaceholderText(/nome completo/i);
    await user.type(nomeCompleto, 'João da Silva');
    await user.type(await screen.findByPlaceholderText('000.000.000-00'), '39053344705');
    await user.type(screen.getByPlaceholderText('email@exemplo.com'), 'joao@example.com');
    await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '11987654321');

    await user.click(screen.getByRole('button', { name: /próximo/i }));
    await user.click(screen.getByRole('button', { name: /próximo/i }));

    await user.click(screen.getByRole('button', { name: /próximo/i }));
    await user.click(screen.getByRole('button', { name: /Criar Inquilino/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const [data] = handleSubmit.mock.calls[0];
    expect(data.nome_completo).toBe('João da Silva');
  });

  it('renders form with correct initial step', () => {
    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    expect(screen.getByText('Dados Básicos do Inquilino')).toBeDefined();
    expect(screen.getByDisplayValue('Pessoa Física')).toBeDefined();
  });

  it('allows navigation between steps', async () => {
    const user = userEvent.setup();

    render(
      <InquilinoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={() => undefined}
      />
    );

    const nomeCompleto = await screen.findByPlaceholderText(/nome completo/i);
    await user.type(nomeCompleto, 'João da Silva');
    await user.type(await screen.findByPlaceholderText('000.000.000-00'), '39053344705');
    await user.type(screen.getByPlaceholderText('email@exemplo.com'), 'joao@example.com');
    await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '11987654321');

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

    expect(screen.getByPlaceholderText(/nome completo/i)).toBeDefined();

    const tipoSelect = screen.getByDisplayValue('Pessoa Física');
    await user.selectOptions(tipoSelect, 'PJ');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite a razão social')).toBeDefined();
      expect(screen.queryByPlaceholderText(/nome completo/i)).toBeNull();
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

  // O formulário atual não exibe ação de descartar rascunho; teste removido

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

    const nomeInput = screen.getByPlaceholderText(/nome completo/i) as HTMLInputElement;
    expect(nomeInput.value).toBe('João da Silva');
  });
});

describe('DadosBasicos', () => {
  // Removido: UI atual não exibe mensagens inline de validação de CPF

  // Removido: UI atual não exibe mensagens de CPF existente inline

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

    expect(screen.getByPlaceholderText(/nome completo/i)).toBeDefined();

    const tipoSelect = screen.getByDisplayValue('Pessoa Física');
    await user.selectOptions(tipoSelect, 'PJ');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite a razão social')).toBeDefined();
      expect(screen.queryByPlaceholderText(/nome completo/i)).toBeNull();
    });
  });
});
