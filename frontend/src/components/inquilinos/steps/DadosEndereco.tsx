import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '../../common/FormField';

export function DadosEndereco() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Endereço (Opcional)
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Forneça o endereço completo do inquilino, se disponível.
        </p>

        <div className="grid grid-cols-1 gap-6">
          <FormField
            name="endereco_completo"
            label="Endereço Completo"
            description="Inclua rua, número, complemento, bairro, cidade, estado e CEP"
          >
            <textarea
              {...register('endereco_completo')}
              rows={4}
              className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ${
                errors.endereco_completo ? 'ring-red-300 focus:ring-red-600 dark:ring-red-500 dark:focus:ring-red-400' : 'ring-gray-300 focus:ring-blue-600 dark:ring-gray-600 dark:focus:ring-blue-400'
              } placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-700`}
              placeholder="Rua das Flores, 123, Apt. 45&#10;Bairro Centro&#10;São Paulo - SP&#10;CEP: 01234-567"
            />
            {errors.endereco_completo && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.endereco_completo.message as string}
              </p>
            )}
          </FormField>
        </div>
      </div>
    </div>
  );
}
