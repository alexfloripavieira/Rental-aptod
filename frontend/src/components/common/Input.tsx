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

      let maskedValue = inputValue.replace(/\D/g, '');

      switch (mask) {
        case '000.000.000-00': // CPF
          maskedValue = maskedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          break;
        case '00.000.000/0000-00': // CNPJ
          maskedValue = maskedValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
          break;
        case '(00) 00000-0000': // Telefone
          maskedValue = maskedValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
          break;
        case '00.000.000-0': // RG
          maskedValue = maskedValue.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
          break;
        default:
          break;
      }

      return maskedValue;
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue = handleMaskedInput(rawValue);

      // Atualiza o estado do React Hook Form
      formOnChange(nextValue);

      // Propaga mudança para listeners externos (se houver)
      if (onChange) {
        const syntheticEvent = {
          ...event,
          target: {
            ...event.target,
            value: nextValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const inputClasses = `
      block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100
      shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500
      focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400 sm:text-sm sm:leading-6
      disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-400
      ${hasError ? 'ring-red-300 focus:ring-red-600 dark:ring-red-500 dark:focus:ring-red-400' : ''}
      ${loading ? 'bg-gray-50 dark:bg-gray-700' : ''}
      ${className}
    `.trim();

    return (
      <div className="relative">
        <input
          {...props}
          id={name}
          name={name}
          value={value ?? ''}
          className={inputClasses}
          onChange={mask ? handleInputChange : (event) => {
            formOnChange(event);
            if (onChange) onChange(event);
          }}
          onBlur={onBlur}
          disabled={loading || props.disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
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
