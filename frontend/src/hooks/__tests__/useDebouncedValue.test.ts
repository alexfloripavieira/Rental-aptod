import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    vi.advanceTimersByTime(300);

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
    vi.advanceTimersByTime(150);

    // Segunda mudança antes do delay completar
    rerender({ value: 'change2' });
    vi.advanceTimersByTime(150);

    // Ainda deve ser o valor inicial
    expect(result.current).toBe('initial');

    // Completa o delay da segunda mudança
    vi.advanceTimersByTime(150);

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
    vi.advanceTimersByTime(300);
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(200);
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
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe(456);
    });
  });
});
