import React from 'react';
import { LayoutDashboard, ArrowLeftRight, Plus, FileSearch, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNew: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab, onOpenNew }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 px-4 flex items-center justify-around z-40 shadow-lg">
      <button
        onClick={() => setCurrentTab('dashboard')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        <LayoutDashboard className="w-5 h-5" />
        Início
      </button>

      <button
        onClick={() => setCurrentTab('cpf')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentTab === 'cpf' ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        Movimentações
      </button>

      <button
        onClick={onOpenNew}
        className="w-12 h-12 bg-[#14263d] text-white rounded-full grid place-items-center -mt-5 shadow-lg hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      <button
        onClick={() => setCurrentTab('documents')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentTab === 'documents' ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        <FileSearch className="w-5 h-5" />
        Documentos
      </button>

      <button
        onClick={() => setCurrentTab('settings')}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentTab === 'settings' ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        <User className="w-5 h-5" />
        Configurações
      </button>
    </div>
  );
};
