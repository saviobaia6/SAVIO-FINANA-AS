import React from 'react';
import { EntityScope } from '../types';
import { Bell, ShieldCheck, UserCheck, Building } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  scope: EntityScope;
  setScope: (scope: EntityScope) => void;
  period: string;
  setPeriod: (period: string) => void;
  onOpenNewTransaction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  scope,
  setScope,
  period,
  setPeriod
}) => {
  const tabTitles: Record<string, string> = {
    dashboard: 'Visão executiva',
    cpf: 'Finanças pessoais · CPF',
    cnpj: 'Empresa · CNPJ / MEI',
    accounts: 'Contas bancárias',
    cards: 'Cartões de crédito',
    boletos: 'Boletos e contas a pagar',
    debts: 'Dívidas e compromissos',
    planning: 'Planejamento 50/30/20',
    assets: 'Patrimônio e investimentos',
    documents: 'Central de Documentos & OCR',
    imports: 'Extratos & Open Finance',
    ai: 'Inteligência Artificial',
    reports: 'Relatórios gerenciais',
    settings: 'Configurações'
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e5eaf0] shadow-xs px-4 md:px-8 select-none">
      <div className="min-h-16 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">SAVIO FINANÇAS</span>
          <h2 className="text-base md:text-lg font-bold text-[#14263d] truncate">
            {tabTitles[currentTab] || 'Dashboard'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-200 py-1.5 px-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="11/2026">Nov/2026</option>
            <option value="10/2026">Out/2026</option>
            <option value="2026">2026 (Ano)</option>
          </select>

          <button
            type="button"
            aria-label="Notificações"
            className="min-w-11 min-h-11 grid place-items-center rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <Bell size={21} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pb-3 pt-1">
        {/* Entity Scope Toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setScope('CONSOLIDATED')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scope === 'CONSOLIDATED' ? 'bg-white text-[#14263d] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Consolidado
          </button>
          <button
            onClick={() => setScope('CPF')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scope === 'CPF' ? 'bg-white text-[#14263d] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            CPF
          </button>
          <button
            onClick={() => setScope('CNPJ')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scope === 'CNPJ' ? 'bg-white text-[#14263d] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-600" />
            CNPJ
          </button>
        </div>
      </div>
    </header>
  );
};
