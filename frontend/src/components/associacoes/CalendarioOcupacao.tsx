import React, { useMemo } from 'react';
import type { AssociacaoDetail } from '../../types/inquilino';

interface CalendarioOcupacaoProps {
  inquilinoId: number;
  associacoes: AssociacaoDetail[];
}

export function CalendarioOcupacao({ inquilinoId, associacoes }: CalendarioOcupacaoProps) {
  // Agrupar associações por ano
  const associacoesPorAno = useMemo(() => {
    const grupos: { [ano: string]: AssociacaoDetail[] } = {};

    associacoes.forEach((associacao) => {
      const anoInicio = new Date(associacao.data_inicio).getFullYear();
      const anoFim = associacao.data_fim
        ? new Date(associacao.data_fim).getFullYear()
        : new Date().getFullYear();

      // Adicionar associação a cada ano que ela abrange
      for (let ano = anoInicio; ano <= anoFim; ano++) {
        if (!grupos[ano]) {
          grupos[ano] = [];
        }
        grupos[ano].push(associacao);
      }
    });

    return grupos;
  }, [associacoes]);

  const anos = Object.keys(associacoesPorAno).sort((a, b) => Number(b) - Number(a));

  if (associacoes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Nenhuma Associação
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Este inquilino ainda não possui histórico de associações para exibir no calendário.
        </p>
      </div>
    );
  }

  const renderTimeline = (ano: string) => {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    return (
      <div key={ano} className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{ano}</h4>

        {/* Linha do tempo dos meses */}
        <div className="relative">
          {/* Grid de meses */}
          <div className="grid grid-cols-12 gap-1 mb-2">
            {meses.map((mes, idx) => (
              <div key={idx} className="text-center text-xs text-gray-500 dark:text-gray-400">
                {mes}
              </div>
            ))}
          </div>

          {/* Barras de ocupação */}
          <div className="space-y-2">
            {associacoesPorAno[ano].map((associacao) => {
              const dataInicio = new Date(associacao.data_inicio);
              const dataFim = associacao.data_fim ? new Date(associacao.data_fim) : new Date();

              const anoAtual = Number(ano);
              const inicioNoAno = dataInicio.getFullYear() === anoAtual ? dataInicio : new Date(anoAtual, 0, 1);
              const fimNoAno = dataFim.getFullYear() === anoAtual ? dataFim : new Date(anoAtual, 11, 31);

              const mesInicio = inicioNoAno.getMonth();
              const mesFim = fimNoAno.getMonth();
              const diaInicio = inicioNoAno.getDate();
              const diaFim = fimNoAno.getDate();

              // Calcular posição e largura da barra
              const totalDiasAno = 365;
              const diasPassados = mesInicio * 30.44 + diaInicio;
              const diasTotais = (mesFim - mesInicio) * 30.44 + (diaFim - diaInicio);

              const left = (diasPassados / totalDiasAno) * 100;
              const width = (diasTotais / totalDiasAno) * 100;

              return (
                <div key={associacao.id} className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded">
                  <div
                    className={`absolute h-full rounded flex items-center px-2 ${
                      associacao.esta_ativo
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: '40px'
                    }}
                    title={`${associacao.apartamento_info.unit_number} - ${associacao.apartamento_info.building_name}`}
                  >
                    <span className="text-xs text-white font-medium truncate">
                      {associacao.apartamento_info.unit_number}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {associacoesPorAno[ano].map((associacao) => (
            <div key={associacao.id} className="flex items-center">
              <div
                className={`w-3 h-3 rounded mr-2 ${
                  associacao.esta_ativo ? 'bg-green-500' : 'bg-blue-500'
                }`}
              ></div>
              <span className="text-gray-700 dark:text-gray-300">
                {associacao.apartamento_info.unit_number} - {associacao.apartamento_info.building_name}
                {associacao.esta_ativo && <span className="ml-1 text-green-600 dark:text-green-400">(Ativo)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Calendário de Ocupação
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
            <span className="text-gray-700 dark:text-gray-300">Ativo</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-blue-500 mr-2"></div>
            <span className="text-gray-700 dark:text-gray-300">Finalizado</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        {anos.map((ano) => renderTimeline(ano))}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total de Associações</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{associacoes.length}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">Associações Ativas</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {associacoes.filter(a => a.esta_ativo).length}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duração Média</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(
              associacoes.reduce((acc, a) => acc + a.duracao_meses, 0) / associacoes.length
            )} meses
          </p>
        </div>
      </div>
    </div>
  );
}
