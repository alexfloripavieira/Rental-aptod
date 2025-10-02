/**
 * Hook de debounce otimizado para reduzir chamadas de API e melhorar performance
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook básico de debounce para valores
 *
 * @param value - Valor a ser debouncado
 * @param delay - Delay em ms (default: 300ms)
 * @returns Valor debouncado
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook de debounce para callbacks
 *
 * @param callback - Função a ser debouncada
 * @param delay - Delay em ms (default: 300ms)
 * @returns Função debouncada
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Atualizar ref do callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Hook de debounce com cancelamento manual
 *
 * @param callback - Função a ser debouncada
 * @param delay - Delay em ms (default: 300ms)
 * @returns Tuple com [função debouncada, função de cancelamento, função de execução imediata]
 */
export function useAdvancedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): [(...args: Parameters<T>) => void, () => void, (...args: Parameters<T>) => void] {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const executeNow = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      callbackRef.current(...args);
    },
    [cancel]
  );

  return [debouncedFn, cancel, executeNow];
}

/**
 * Hook de throttle (alternativa ao debounce)
 * Garante que a função seja chamada no máximo uma vez por intervalo
 *
 * @param callback - Função a ser throttlada
 * @param delay - Delay em ms (default: 300ms)
 * @returns Função throttlada
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callbackRef.current(...args);
            lastRunRef.current = Date.now();
          },
          delay - timeSinceLastRun
        );
      }
    },
    [delay]
  );
}
