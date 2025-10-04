import React from 'react';
import { formatCPF, formatCNPJ, formatPhone, removeMask } from '../../utils/formatters';

type FormatType = 'cpf' | 'cnpj' | 'phone' | 'none';

interface FormattedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  formatType: FormatType;
  onChange: (value: string) => void;
  value: string;
}

export const FormattedInput: React.FC<FormattedInputProps> = ({
  formatType,
  onChange,
  value,
  className = '',
  ...rest
}) => {
  const formatValue = (rawValue: string): string => {
    switch (formatType) {
      case 'cpf':
        return formatCPF(rawValue);
      case 'cnpj':
        return formatCNPJ(rawValue);
      case 'phone':
        return formatPhone(rawValue);
      case 'none':
      default:
        return rawValue;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatValue(rawValue);
    const unmaskedValue = removeMask(formattedValue);

    onChange(unmaskedValue);
  };

  const displayValue = formatValue(value);

  const baseClassName = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400 sm:text-sm sm:leading-6';

  return (
    <input
      {...rest}
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={className || baseClassName}
    />
  );
};
