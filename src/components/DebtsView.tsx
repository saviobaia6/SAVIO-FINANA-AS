import React from 'react';
import { Debt } from '../types';
import { ArrowUpRight, Plus, ShieldAlert } from 'lucide-react';

interface DebtsViewProps {
  debts: Debt[];
}

export const DebtsView: React.FC<DebtsViewProps> = ({ debts }) => {
  const totalDebt = debts.reduce((acc, d) => acc + d.outstandingAmount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Dívidas e compromissos futuros</h2>
          <p className="text-xs text-slate-500">
            Acompanhamento de financiamentos, empréstimos e parcelamentos de longo prazo.
          </p>
        </div>
        <button
          onClick={() => alert('Cadastro de nova dívida será habilitado na próxima etapa.')}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar dívida
        </button>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400">Total de Dívidas / Saldo Devedor</span>
          <div className="text-3xl font-extrabold text-red-700 mt-1">
            R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-3 bg-red-50 text-red-700 rounded-2xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Compromissos ativos</h3>
          <span className="text-xs text-slate-400">{debts.length} ativos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="py-3 px-6 font-semibold">Credor / Descrição</th>
                <th className="py-3 px-6 font-semibold">Vínculo</th>
                <th className="py-3 px-6 font-semibold text-right">Valor Original</th>
                <th className="py-3 px-6 font-semibold text-right">Saldo Devedor</th>
                <th className="py-3 px-6 font-semibold text-right">Parcela Mensal</th>
                <th className="py-3 px-6 font-semibold text-center">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debts.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800">{d.creditorName}</div>
                    <small className="text-slate-400">{d.description}</small>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                      {d.entityId}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-slate-600">
                    R$ {d.originalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-6 text-right font-extrabold text-red-700">
                    R$ {d.outstandingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-slate-800">
                    {d.installmentAmount ? `R$ ${d.installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="py-4 px-6 text-center text-slate-600 font-medium">
                    Dia {d.dueDay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
