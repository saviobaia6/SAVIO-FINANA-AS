import React from 'react';
import { Transaction, EntityScope, Boleto } from '../types';
import { calculateCountdown } from '../utils/countdown';
import { TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, DollarSign, FileWarning, CheckCircle2, Clock } from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  boletos: Boleto[];
  scope: EntityScope;
  period: string;
  onNavigate: (tab: string) => void;
  onOpenNew: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  boletos,
  scope,
  period,
  onNavigate,
  onOpenNew
}) => {
  const filteredTrs = transactions.filter(t => {
    if (scope === 'CPF') return t.entityId === 'CPF';
    if (scope === 'CNPJ') return t.entityId === 'CNPJ';
    return true;
  });

  const totalIncome = filteredTrs
    .filter(t => t.direction === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTrs
    .filter(t => t.direction === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const netResult = totalIncome - totalExpense;
  const preservationRate = totalIncome > 0 ? ((netResult / totalIncome) * 100).toFixed(1) : '0';

  const pendingBoletos = boletos.filter(b => b.status === 'PENDING');
  const totalPendingBoletos = pendingBoletos.reduce((acc, b) => acc + b.valorOriginal, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-20 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Visão executiva</h2>
          <p className="text-xs text-slate-500 mt-1">
            Painel consolidado em tempo real · Escopo: <strong className="text-slate-800">{scope}</strong> ({period})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('documents')}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>📷 Scanner & OCR</span>
          </button>
          <button
            onClick={onOpenNew}
            className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>＋ Novo lançamento</span>
          </button>
        </div>
      </div>

      {/* CENTRAL DE VENCIMENTOS (ADITIVO OBRIGATÓRIO) */}
      <div className="bg-gradient-to-r from-[#14263d] to-[#1d3552] text-white p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Central de Vencimentos & Contadores Regressivos</h3>
          </div>
          <button
            onClick={() => onNavigate('boletos')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Ver todos os boletos →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-[#afbdcc]">Total Pendente</span>
            <div className="text-xl font-extrabold text-white mt-1">
              R$ {totalPendingBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <small className="text-[10px] text-emerald-300 mt-1 block">{pendingBoletos.length} compromissos ativos</small>
          </div>

          {pendingBoletos.slice(0, 2).map((bol) => {
            const countdown = calculateCountdown(bol.vencimento);
            return (
              <div key={bol.id} className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-[11px] text-[#afbdcc] truncate block">{bol.beneficiario}</span>
                <div className="text-sm font-bold text-white mt-1">
                  R$ {bol.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${countdown.badgeColor}`}>
                  ⏱ {countdown.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Receitas recebidas</span>
          <div className="text-2xl font-extrabold text-[#14263d] my-2">
            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 8,4% em relação ao período anterior
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Despesas realizadas</span>
          <div className="text-2xl font-extrabold text-[#14263d] my-2">
            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-red-600 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> 3,1% em relação ao período anterior
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Resultado do período</span>
          <div className={`text-2xl font-extrabold my-2 ${netResult >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            R$ {netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {preservationRate}% da receita preservada
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Contas a vencer</span>
          <div className="text-2xl font-extrabold text-amber-700 my-2">
            R$ {totalPendingBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {pendingBoletos.length} compromissos pendentes
          </div>
        </div>
      </div>

      {/* Two Column Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-[#14263d]">Fluxo financeiro mensal</h3>
              <p className="text-xs text-slate-400">Receitas vs Despesas por competência</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-medium">2026</span>
          </div>

          <div className="h-48 flex items-end gap-4 px-2 pt-4 border-b border-slate-100 pb-2">
            {['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'].map((m, idx) => {
              const hInc = [65, 70, 85, 78, 88, 95][idx];
              const hExp = [45, 50, 55, 42, 58, 52][idx];
              return (
                <div key={m} className="flex-1 h-full flex flex-col justify-end items-center gap-2">
                  <div className="w-full flex justify-center items-end gap-1.5 h-36">
                    <div style={{ height: `${hInc}%` }} className="w-3.5 bg-[#14263d] rounded-t-sm" title="Receitas"></div>
                    <div style={{ height: `${hExp}%` }} className="w-3.5 bg-emerald-500 rounded-t-sm" title="Despesas"></div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{m}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-4 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#14263d]"></span> Receitas
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Despesas
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#14263d] mb-1">Origem das receitas</h3>
            <p className="text-xs text-slate-400 mb-6">Distribuição percentual estimada</p>
          </div>

          <div className="space-y-3 my-auto">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Salários / Câmara</span>
                <span className="text-[#14263d]">44%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#14263d] h-full rounded-full" style={{ width: '44%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Atividade Acadêmica (UNIP/UNIGRANDE)</span>
                <span className="text-emerald-700">25%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Serviços MEI / CNPJ</span>
                <span className="text-blue-700">17%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '17%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Outras entradas</span>
                <span className="text-slate-500">14%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '14%' }}></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Atualizado com base nos lançamentos ativos.
          </div>
        </div>
      </div>

      {/* Lower Section: Recent Transactions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#14263d]">Movimentações recentes</h3>
            <button
              onClick={() => onNavigate('cpf')}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-semibold">Data</th>
                  <th className="pb-3 font-semibold">Descrição</th>
                  <th className="pb-3 font-semibold">Categoria</th>
                  <th className="pb-3 font-semibold">Vínculo</th>
                  <th className="pb-3 font-semibold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTrs.slice(0, 5).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 text-slate-500">{t.date.split('-').reverse().join('/')}</td>
                    <td className="py-3 font-medium text-slate-800">{t.description}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.entityId === 'CPF' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {t.entityId}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-bold ${
                      t.direction === 'INCOME' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {t.direction === 'INCOME' ? '+ ' : '− '}
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#14263d]">Central de atenção</h3>

          <div className="flex items-start gap-3 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <FileWarning className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Fatura próxima do vencimento</p>
              <small className="text-[11px] text-amber-800/80">Cartão Inter · vencimento em 25/11</small>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50/80 border border-blue-200/60 rounded-xl">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">Obrigação MEI / DAS</p>
              <small className="text-[11px] text-blue-800/80">Guia DAS de novembro disponível para leitura.</small>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Reserva de Emergência</p>
              <small className="text-[11px] text-slate-600">Meta mensal atingida (100% do planejado).</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
