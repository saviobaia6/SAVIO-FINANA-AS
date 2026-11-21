import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  Building2, 
  Wallet, 
  CreditCard, 
  FileText, 
  Receipt, 
  PieChart, 
  TrendingUp, 
  ArrowUpRight, 
  FileSearch, 
  Bot, 
  Settings,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Visão executiva', icon: LayoutDashboard, section: 'GESTÃO' },
    { id: 'cpf', label: 'Pessoal · CPF', icon: User, section: 'FINANÇAS' },
    { id: 'cnpj', label: 'Empresa · CNPJ', icon: Building2, section: 'FINANÇAS' },
    { id: 'accounts', label: 'Contas bancárias', icon: Wallet, section: 'FINANÇAS' },
    { id: 'cards', label: 'Cartões de crédito', icon: CreditCard, section: 'FINANÇAS' },
    { id: 'boletos', label: 'Boletos e contas', icon: Receipt, section: 'FINANÇAS' },
    { id: 'debts', label: 'Dívidas e compromissos', icon: ArrowUpRight, section: 'FINANÇAS' },
    { id: 'planning', label: 'Planejamento 50/30/20', icon: PieChart, section: 'FINANÇAS' },
    { id: 'assets', label: 'Patrimônio e ativos', icon: TrendingUp, section: 'FINANÇAS' },
    { id: 'documents', label: 'Leitor & Scanner IA', icon: FileSearch, section: 'INTELIGÊNCIA' },
    { id: 'imports', label: 'Extratos & Open Finance', icon: FolderOpen, section: 'INTELIGÊNCIA' },
    { id: 'ai', label: 'IA Financeira', icon: Bot, section: 'INTELIGÊNCIA' },
    { id: 'reports', label: 'Relatórios gerenciais', icon: FileText, section: 'INTELIGÊNCIA' },
    { id: 'settings', label: 'Configurações', icon: Settings, section: 'SISTEMA' },
  ];

  let lastSection = '';

  return (
    <aside className="w-64 bg-[#14263d] text-white p-5 flex flex-col flex-shrink-0 select-none shadow-xl">
      <div className="px-3 py-2 mb-2">
        <h1 className="text-xl font-extrabold tracking-wider text-white">
          FINANCE <span className="text-emerald-400">IA</span>
        </h1>
        <small className="block text-[9px] tracking-widest text-[#aebed0] uppercase mt-1">
          Gestão Inteligente & Autônoma
        </small>
      </div>

      <div className="my-3 px-3 py-3 bg-[#203a59] rounded-xl flex items-center gap-3 border border-[#2a4d75]">
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 grid place-items-center font-bold text-sm">
          FA
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white truncate">Sócio Titular</p>
          <small className="block text-[11px] text-[#afbdcc] truncate">CPF & CNPJ Ativos</small>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
        {menuItems.map((item) => {
          const showSectionHeader = item.section !== lastSection;
          lastSection = item.section;
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <React.Fragment key={item.id}>
              {showSectionHeader && (
                <div className="text-[10px] text-[#90a3b9] tracking-widest px-3 pt-4 pb-1 font-semibold">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                    : 'text-[#d5deea] hover:bg-[#203a59] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#a9bed3]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="mt-4 pt-3 border-t border-[#203a59] text-[11px] text-[#9aadc1] flex items-center justify-between">
        <span>v1.5 Pro · Supabase ready</span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </div>
    </aside>
  );
};
