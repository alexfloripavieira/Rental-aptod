import React from 'react';

interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

export function FormField({
  name,
  label,
  required = false,
  description,
  children
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
      >
        {label}
        {required && (
          // Indicador visual apenas; escondido de tecnologias assistivas
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}

      {children}
    </div>
  );
}
