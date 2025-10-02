import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {

  it('deve retornar o valor inicial imediatamente', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('deve debounce mudanças de valor', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Muda o valor
    rerender({ value: 'changed' });

    // Valor ainda deve ser o inicial
    expect(result.current).toBe('initial');

    // Avança o tempo
    await new Promise((r) => setTimeout(r, 300));

    await waitFor(() => {
      expect(result.current).toBe('changed');
    });
  });

  it('deve reiniciar o timer se o valor mudar antes do delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Primeira mudança
    rerender({ value: 'change1' });
    await new Promise((r) => setTimeout(r, 150));

    // Segunda mudança antes do delay completar
    rerender({ value: 'change2' });
    await new Promise((r) => setTimeout(r, 150));

    // Ainda deve ser o valor inicial
    expect(result.current).toBe('initial');

    // Completa o delay da segunda mudança
    await new Promise((r) => setTimeout(r, 150));

    await waitFor(() => {
      expect(result.current).toBe('change2');
    });
  });

  it('deve funcionar com diferentes delays', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });
    await new Promise((r) => setTimeout(r, 300));
    expect(result.current).toBe('initial');

    await new Promise((r) => setTimeout(r, 200));
    await waitFor(() => {
      expect(result.current).toBe('changed');
    });
  });

  it('deve funcionar com diferentes tipos de valores', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 123 } }
    );

    expect(result.current).toBe(123);

    rerender({ value: 456 });
    await new Promise((r) => setTimeout(r, 300));

    await waitFor(() => {
      expect(result.current).toBe(456);
    });
  });
});
