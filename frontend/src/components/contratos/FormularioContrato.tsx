import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { contratoSchema } from '../../schemas/contratoValidation';
import type { ContratoFormData } from '../../types/contrato';
import { locadorService, type LocadorEntity } from '../../services/locadorService';
import { FormattedInput } from '../common/FormattedInput';

interface FormularioContratoProps {
  onSubmit: (data: ContratoFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  // Valores iniciais opcionais para pré-preenchimento do formulário
  defaultValues?: Partial<ContratoFormData>;
}

export function FormularioContrato({ onSubmit, onCancel, loading, defaultValues }: FormularioContratoProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<ContratoFormData>({
    resolver: yupResolver(contratoSchema),
    mode: 'onBlur',
    defaultValues: defaultValues as any,
  });

  // Estado e busca de locadores
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<LocadorEntity[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedLocador, setSelectedLocador] = useState<LocadorEntity | null>(null);
  const locadorNomeSelecionado = watch('locador.nomeCompleto');

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues as any);
      setQuery(defaultValues.locador?.nomeCompleto || '');
    }
  }, [defaultValues, reset]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const term = query.trim();
      setLoadingOptions(true);
      try {
        console.debug('[FormularioContrato] buscando locadores com termo:', term);
        const res = await locadorService.list(term.length > 0 ? term : undefined);
        if (!cancelled) {
          setOptions(res);
          if (res.length > 0 && !locadorNomeSelecionado) {
            applyLocador(res[0]);
          }
        }
      } catch (error) {
        console.error('[FormularioContrato] erro ao buscar locadores', error);
        if (!cancelled) setOptions([]);
        console.error('Erro ao carregar locadores:', error);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [query, locadorNomeSelecionado]);

  const applyLocador = (loc: LocadorEntity) => {
    setValue('locador.nomeCompleto', loc.nome_completo || '', { shouldDirty: true, shouldValidate: true });
    setValue('locador.nacionalidade', loc.nacionalidade || 'Brasileira', { shouldDirty: true, shouldValidate: true });
    setValue('locador.estadoCivil', loc.estado_civil || 'Solteiro(a)', { shouldDirty: true, shouldValidate: true });
    setValue('locador.profissao', loc.profissao || 'Proprietário', { shouldDirty: true, shouldValidate: true });
    setValue('locador.cpf', loc.cpf || '', { shouldDirty: true, shouldValidate: true });
    setValue('locador.endereco.rua', loc.endereco_rua || 'Endereço do locador', { shouldDirty: true, shouldValidate: true });
    setValue('locador.endereco.numero', loc.endereco_numero || 'S/N', { shouldDirty: true, shouldValidate: true });
    setValue('locador.endereco.bairro', loc.endereco_bairro || 'Centro', { shouldDirty: true, shouldValidate: true });
    setValue('locador.endereco.cidade', loc.endereco_cidade || 'Cidade', { shouldDirty: true, shouldValidate: true });
    setValue('locador.endereco.estado', loc.endereco_estado || 'SC', { shouldDirty: true, shouldValidate: true });
    setValue('locador.endereco.cep', loc.endereco_cep || '88000-000', { shouldDirty: true, shouldValidate: true });
    setSelectedLocador(loc);
    setQuery(loc.nome_completo);
    setShowOptions(false);
  };

  useEffect(() => {
    if (!locadorNomeSelecionado && options.length > 0 && query.trim().length === 0) {
      applyLocador(options[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query]);

  const normalizeLocador = (base: Partial<ContratoFormData>['locador'] | undefined, fallback?: LocadorEntity) => {
    const loc = base || {};  
    const entity = fallback;
    return {
      nomeCompleto: loc.nomeCompleto || entity?.nome_completo || '',
      nacionalidade: loc.nacionalidade || entity?.nacionalidade || 'Brasileira',
      estadoCivil: loc.estadoCivil || entity?.estado_civil || 'Solteiro(a)',
      profissao: loc.profissao || entity?.profissao || 'Proprietário',
      cpf: loc.cpf || entity?.cpf || '',
      endereco: {
        rua: loc.endereco?.rua || entity?.endereco_rua || 'Endereço do locador',
        numero: loc.endereco?.numero || entity?.endereco_numero || 'S/N',
        bairro: loc.endereco?.bairro || entity?.endereco_bairro || 'Centro',
        cidade: loc.endereco?.cidade || entity?.endereco_cidade || 'Cidade',
        estado: loc.endereco?.estado || entity?.endereco_estado || 'SC',
        cep: loc.endereco?.cep || entity?.endereco_cep || '88000-000',
      },
    };
  };

  const onSubmitHandler = async (data: ContratoFormData) => {
    let fallbackLocador = selectedLocador;

    if (!fallbackLocador && options.length === 0) {
      try {
        const lista = await locadorService.list();
        if (lista.length > 0) {
          fallbackLocador = lista[0];
        }
      } catch (error) {
        console.error('[FormularioContrato] não foi possível carregar locadores para fallback', error);
      }
    }

    if (!fallbackLocador && options.length > 0) {
      fallbackLocador = options[0];
    }

    const merged: ContratoFormData = {
      ...data,
      locador: normalizeLocador(data.locador, fallbackLocador),
      locatario: {
        ...data.locatario,
        nacionalidade: data.locatario.nacionalidade || 'Brasileira',
        rg: data.locatario.rg || '0000000',
        rgOrgao: data.locatario.rgOrgao || 'SSP/SC',
        enderecoCompleto: data.locatario.enderecoCompleto || 'Endereço informado na ficha cadastral.',
        telefone: data.locatario.telefone || '(48) 0000-0000',
        profissao: data.locatario.profissao || 'Profissão não informada',
      },
      contrato: {
        ...data.contrato,
        dataInicio: data.contrato.dataInicio || new Date().toISOString().split('T')[0],
        valorCaucao: data.contrato.valorCaucao || 1000,
        clausulaSegunda: data.contrato.clausulaSegunda || 'O aluguel convencionado é de R$ 1.000,00 mensais, com pagamento até o dia 05 de cada mês.',
      },
      inventarioMoveis: data.inventarioMoveis || 'Armário de cozinha, mesa com cadeiras, sofá, geladeira e fogão em bom estado de conservação.',
    };

    console.debug('[FormularioContrato] payload enviado ao servidor', merged);

    if (!merged.locador?.nomeCompleto?.trim() || !merged.locador?.cpf?.trim()) {
      window.alert('Selecione um locador válido antes de gerar o contrato.');
      return;
    }

    await onSubmit(merged);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6 modal-form">
      <section className="border p-4 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-2">Selecionar Locador</h3>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowOptions(true)}
            placeholder="Busque por nome ou CPF do locador"
            className="input-field"
          />
          {showOptions && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow max-h-60 overflow-auto text-gray-900 dark:text-gray-100">
              {loadingOptions && <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>}
              {!loadingOptions && options.length === 0 && query.length >= 2 && (
                <div className="px-3 py-2 text-sm text-gray-500">Nenhum locador encontrado</div>
              )}
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => applyLocador(opt)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {opt.nome_completo} — {opt.cpf}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="border p-4 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Dados do Locador</h3>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              {...register('locador.nomeCompleto')}
              className="input-field"
              placeholder="Nome completo do locador"
            />
            {errors.locador?.nomeCompleto && (
              <p className="text-red-500 text-sm mt-1">
                {errors.locador.nomeCompleto.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Nacionalidade <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.nacionalidade')}
                className="input-field"
                placeholder="brasileiro, argentino, etc."
              />
              {errors.locador?.nacionalidade && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.nacionalidade.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Estado Civil <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.estadoCivil')}
                className="input-field"
                placeholder="solteiro, casado, etc."
              />
              {errors.locador?.estadoCivil && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.estadoCivil.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Profissão <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.profissao')}
                className="input-field"
              />
              {errors.locador?.profissao && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.profissao.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                CPF <span className="text-red-500">*</span>
              </label>
              <Controller
                name="locador.cpf"
                control={control}
                render={({ field }) => (
                  <FormattedInput
                    formatType="cpf"
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="000.000.000-00"
                    className="input-field"
                  />
                )}
              />
              {errors.locador?.cpf && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.cpf.message}
                </p>
              )}
            </div>
          </div>

          <h4 className="font-semibold mt-4">Endereço do Locador</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block font-medium mb-1">
                Rua <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.rua')}
                className="input-field"
              />
              {errors.locador?.endereco?.rua && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.rua.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.numero')}
                className="input-field"
              />
              {errors.locador?.endereco?.numero && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.numero.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block font-medium mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.bairro')}
                className="input-field"
              />
              {errors.locador?.endereco?.bairro && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.bairro.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.cidade')}
                className="input-field"
              />
              {errors.locador?.endereco?.cidade && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.cidade.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                UF <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.estado')}
                className="input-field"
                maxLength={2}
                placeholder="SC"
              />
              {errors.locador?.endereco?.estado && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.estado.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">
              CEP <span className="text-red-500">*</span>
            </label>
            <input
              {...register('locador.endereco.cep')}
              className="input-field"
              placeholder="XXXXX-XXX"
            />
            {errors.locador?.endereco?.cep && (
              <p className="text-red-500 text-sm mt-1">
                {errors.locador.endereco.cep.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border p-4 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Dados do Locatário</h3>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              {...register('locatario.nomeCompleto')}
              className="input-field"
              placeholder="Nome completo do locatário"
            />
            {errors.locatario?.nomeCompleto && (
              <p className="text-red-500 text-sm mt-1">
                {errors.locatario.nomeCompleto.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Nacionalidade <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locatario.nacionalidade')}
                className="input-field"
                placeholder="brasileiro, argentino, etc."
              />
              {errors.locatario?.nacionalidade && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locatario.nacionalidade.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Profissão <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locatario.profissao')}
                className="input-field"
              />
              {errors.locatario?.profissao && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locatario.profissao.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                CPF <span className="text-red-500">*</span>
              </label>
              <Controller
                name="locatario.cpf"
                control={control}
                render={({ field }) => (
                  <FormattedInput
                    formatType="cpf"
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="000.000.000-00"
                    className="input-field"
                  />
                )}
              />
              {errors.locatario?.cpf && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locatario.cpf.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                RG <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locatario.rg')}
                className="input-field"
                placeholder="0.000.000"
              />
              {errors.locatario?.rg && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locatario.rg.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">
              Órgão Emissor RG <span className="text-red-500">*</span>
            </label>
              <input
                {...register('locatario.rgOrgao')}
                className="input-field"
                placeholder="SSP/SC"
              />
            {errors.locatario?.rgOrgao && (
              <p className="text-red-500 text-sm mt-1">
                {errors.locatario.rgOrgao.message}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">
              Endereço Completo <span className="text-red-500">*</span>
            </label>
            <input
              {...register('locatario.enderecoCompleto')}
              className="input-field"
              placeholder="Rua, número, bairro, cidade - UF, CEP"
            />
            {errors.locatario?.enderecoCompleto && (
              <p className="text-red-500 text-sm mt-1">
                {errors.locatario.enderecoCompleto.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Telefone <span className="text-red-500">*</span>
              </label>
              <Controller
                name="locatario.telefone"
                control={control}
                render={({ field }) => (
                  <FormattedInput
                    formatType="phone"
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="(00) 00000-0000"
                    className="input-field"
                  />
                )}
              />
              {errors.locatario?.telefone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locatario.telefone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('locatario.email')}
                className="input-field"
                placeholder="email@exemplo.com"
              />
              {errors.locatario?.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locatario.email.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border p-4 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Detalhes do Contrato</h3>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Data de Início <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('contrato.dataInicio')}
              className="input-field"
            />
            {errors.contrato?.dataInicio && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contrato.dataInicio.message}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">
              Valor da Caução (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('contrato.valorCaucao')}
              className="input-field"
              placeholder="1700.00"
            />
            {errors.contrato?.valorCaucao && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contrato.valorCaucao.message}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">
              Cláusula Segunda (Acordo de Pagamento){' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('contrato.clausulaSegunda')}
              className="input-field"
              rows={5}
              placeholder="O aluguel convencionado é de R$ 1.700,00 mensais..."
            />
            {errors.contrato?.clausulaSegunda && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contrato.clausulaSegunda.message}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Mínimo 50 caracteres, máximo 5000
            </p>
          </div>
        </div>
      </section>

      <section className="border p-4 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Inventário de Móveis</h3>

        <div>
          <label className="block font-medium mb-1">
            Descrição dos Móveis <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('inventarioMoveis')}
            className="input-field"
            rows={4}
            placeholder="armário de pia com tampo em granito, guarda-roupa, fogão elétrico..."
          />
          {errors.inventarioMoveis && (
            <p className="text-red-500 text-sm mt-1">
              {errors.inventarioMoveis.message}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Mínimo 20 caracteres, máximo 2000
          </p>
        </div>
      </section>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded hover:bg-gray-100 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Gerando...' : 'Gerar Contrato'}
        </button>
      </div>
    </form>
  );
}
