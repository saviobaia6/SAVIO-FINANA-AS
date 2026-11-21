import React from 'react';
import { FileText, Printer, Download } from 'lucide-react';

export const ReportsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn pb-20 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Relatórios Gerenciais</h2>
          <p className="text-xs text-slate-500">
            Análises mensais, anuais e consolidadas para suporte à tomada de decisão.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-400 font-semibold">Comparativo Anual</span>
          <div className="text-xl font-extrabold text-[#14263d] mt-1">2024 – 2026</div>
          <small className="text-[11px] text-slate-400 mt-1 block">Histórico completo</small>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-400 font-semibold">Fluxo de Caixa</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">Mensal</div>
          <small className="text-[11px] text-slate-400 mt-1 block">Competência e caixa</small>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-400 font-semibold">Endividamento</span>
          <div className="text-xl font-extrabold text-amber-700 mt-1">Por Cartão</div>
          <small className="text-[11px] text-slate-400 mt-1 block">Compromissos futuros</small>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-400 font-semibold">Exportação</span>
          <div className="text-xl font-extrabold text-blue-700 mt-1">PDF / Excel</div>
          <small className="text-[11px] text-slate-400 mt-1 block">Google Sheets & Drive</small>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#14263d]">Relatórios detalhados</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          <li className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <span>Receitas por fonte pagadora (Câmara, UNIP, MEI)</span>
            <span className="font-bold text-emerald-700">Ativo</span>
          </li>
          <li className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <span>Despesas por categoria e centro de custo</span>
            <span className="font-bold text-emerald-700">Ativo</span>
          </li>
          <li className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <span>Evolução da Reserva de Emergência e Patrimônio</span>
            <span className="font-bold text-emerald-700">Ativo</span>
          </li>
          <li className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <span>Resultado Operacional do MEI / CNPJ</span>
            <span className="font-bold text-emerald-700">Ativo</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
