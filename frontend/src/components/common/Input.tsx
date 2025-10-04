import React, { forwardRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  mask?: string;
  loading?: boolean;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ name, mask, loading, error, className = '', onChange, ...props }, forwardedRef) => {
    const {
      control,
      formState: { errors },
    } = useFormContext();

    const {
      field: { value, onChange: formOnChange, onBlur, ref },
    } = useController({ name, control });

    const fieldError = (error ?? (errors[name]?.message as string)) || undefined;
    const hasError = Boolean(fieldError);

    const handleMaskedInput = (inputValue: string) => {
      if (!mask) return inputValue;

      let digits = inputValue.replace(/\D/g, '');

      switch (mask) {
        case '000.000.000-00': { // CPF
          digits = digits.slice(0, 11);
          if (digits.length <= 3) return digits;
          if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
          if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
          return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        }
        case '00.000.000/0000-00': { // CNPJ
          digits = digits.slice(0, 14);
          if (digits.length <= 2) return digits;
          if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
          if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
          if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
          return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
        }
        case '(00) 00000-0000': { // Telefone
          digits = digits.slice(0, 11);
          if (digits.length === 0) return '';
          if (digits.length <= 2) return `(${digits}`;
          if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
          if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
        case '00.000.000-0': { // RG
          digits = digits.slice(0, 9);
          if (digits.length <= 2) return digits;
          if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
          if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
          return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
        }
        default:
          return inputValue;
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue = handleMaskedInput(rawValue);

      // Atualiza o estado do React Hook Form com o valor já mascarado
      formOnChange(nextValue);

      // Propaga mudança para listeners externos (se houver)
      if (onChange) {
        try {
          // Envia diretamente o valor (string) para handlers que esperam texto
          // @ts-expect-error aceitar tanto string quanto evento
          onChange(nextValue);
        } catch {
          // Fallback: envia o evento original com o valor atualizado
          const syntheticEvent = {
            ...event,
            target: {
              ...event.target,
              value: nextValue,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }
    };

    const inputClasses = `
      block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
      shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500
      focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400 sm:text-sm sm:leading-6
      disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-400
      ${hasError ? 'ring-red-300 focus:ring-red-600 dark:ring-red-500 dark:focus:ring-red-400' : ''}
      ${loading ? 'bg-gray-50 dark:bg-gray-700' : ''}
      ${className}
    `.trim();

    React.useEffect(() => {
      if (mask && typeof value === 'string') {
        const formatted = handleMaskedInput(value);
        if (formatted !== value) {
          formOnChange(formatted);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mask]);

    return (
      <div className="relative">
        <input
          {...props}
          id={name}
          name={name}
          value={value ?? ''}
          className={inputClasses}
          onChange={mask ? handleInputChange : (event) => {
            const val = event.target.value;
            formOnChange(val);
            if (onChange) {
              // @ts-expect-error aceitar tanto string quanto evento
              onChange(val);
            }
          }}
          onBlur={onBlur}
          disabled={loading || props.disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          // Se possuir máscara, limitar o comprimento máximo ao tamanho da máscara
          maxLength={mask ? mask.length : props.maxLength}
          inputMode={mask ? 'numeric' : props.inputMode}
          ref={(element) => {
            ref(element);
            if (typeof forwardedRef === 'function') {
              forwardedRef(element);
            } else if (forwardedRef) {
              (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
            }
          }}
        />

        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}

        {hasError && (
          <p
            id={`${name}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {fieldError}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
