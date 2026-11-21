import React from 'react';
import { EntityScope } from '../types';
import { Bell, Sparkles, Plus, ShieldCheck, UserCheck, Building } from 'lucide-react';

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
  setPeriod,
  onOpenNewTransaction
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
    documents: 'Leitor Inteligente & Scanner',
    imports: 'Extratos & Open Finance',
    ai: 'Inteligência Artificial Financeira',
    reports: 'Relatórios gerenciais',
    settings: 'Configurações do sistema'
  };

  return (
    <header className="h-16 bg-white border-b border-[#e5eaf0] px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 font-medium">FINANCE IA</span>
        <span className="text-slate-300">/</span>
        <h2 className="text-sm font-bold text-[#14263d]">{tabTitles[currentTab] || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Entity Scope Toggle */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => setScope('CONSOLIDATED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              scope === 'CONSOLIDATED'
                ? 'bg-white text-[#14263d] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Consolidado
          </button>
          <button
            onClick={() => setScope('CPF')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              scope === 'CPF'
                ? 'bg-white text-[#14263d] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            CPF
          </button>
          <button
            onClick={() => setScope('CNPJ')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              scope === 'CNPJ'
                ? 'bg-white text-[#14263d] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-600" />
            CNPJ
          </button>
        </div>

        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-slate-200 py-1.5 px-3 rounded-xl bg-white text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="11/2026">Novembro de 2026</option>
          <option value="10/2026">Outubro de 2026</option>
          <option value="2026">2026 · Ano completo</option>
        </select>

        <button
          onClick={onOpenNewTransaction}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo lançamento
        </button>

        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 grid place-items-center text-slate-600 relative cursor-pointer hover:bg-slate-200 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
        </div>
      </div>
    </header>
  );
};
