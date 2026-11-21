import React from 'react';
import { LayoutDashboard, ArrowLeftRight, Plus, Wallet, FileText } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNew: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab, onOpenNew }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-16 px-3 flex items-center justify-around z-40 shadow-xl select-none">
      <button
        onClick={() => setCurrentTab('dashboard')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          currentTab === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        Início
      </button>

      <button
        onClick={() => setCurrentTab('cpf')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          currentTab === 'cpf' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        Movimentações
      </button>

      <button
        onClick={onOpenNew}
        className="w-12 h-12 bg-[#14263d] dark:bg-emerald-600 text-white rounded-full grid place-items-center -mt-5 shadow-lg hover:scale-105 transition-transform active:scale-95 cursor-pointer"
        title="Adicionar lançamento"
      >
        <Plus className="w-6 h-6" />
      </button>

      <button
        onClick={() => setCurrentTab('accounts')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          currentTab === 'accounts' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Wallet className="w-5 h-5" />
        Contas
      </button>

      <button
        onClick={() => setCurrentTab('documents')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          currentTab === 'documents' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <FileText className="w-5 h-5" />
        Mais
      </button>
    </div>
  );
};
