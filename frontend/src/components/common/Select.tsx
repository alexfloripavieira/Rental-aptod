import React, { forwardRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ name, options, error, className = '', ...props }, forwardedRef) => {
    const {
      control,
      formState: { errors },
    } = useFormContext();

    const {
      field: { value, onChange, onBlur, ref },
    } = useController({ name, control });

    const fieldError = (error ?? (errors[name]?.message as string)) || undefined;
    const hasError = Boolean(fieldError);

    const selectClasses = `
      block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100
      shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600
      focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400 sm:text-sm sm:leading-6
      disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-400
      ${hasError ? 'ring-red-300 focus:ring-red-600 dark:ring-red-500 dark:focus:ring-red-400' : ''}
      ${className}
    `.trim();

    return (
      <div>
        <select
          {...props}
          id={name}
          name={name}
          value={value ?? ''}
          className={selectClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          onChange={onChange}
          onBlur={onBlur}
          ref={(element) => {
            ref(element);
            if (typeof forwardedRef === 'function') {
              forwardedRef(element);
            } else if (forwardedRef) {
              (forwardedRef as React.MutableRefObject<HTMLSelectElement | null>).current = element;
            }
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

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

Select.displayName = 'Select';
