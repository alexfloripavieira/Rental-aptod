import { useState, useEffect } from 'react';

/**
 * Hook que debounce um valor, útil para busca em tempo real
 * @param value - Valor a ser debounced
 * @param delay - Tempo de delay em milissegundos (padrão: 300ms)
 * @returns O valor debounced
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Define um timeout para atualizar o valor debounced
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timeout se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
