import React, { useState } from 'react';
import { EntityScope, Boleto } from '../types';
import { calculateCountdown } from '../utils/countdown';
import { PeriodOption } from '../utils/dateUtils';
import { PWAInstallButton } from './PWAInstallButton';
import { Bell, ShieldCheck, UserCheck, Building, Sun, Moon, Plus, X } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  scope: EntityScope;
  setScope: (scope: EntityScope) => void;
  period: string;
  setPeriod: (period: string) => void;
  periodOptions: PeriodOption[];
  onOpenNewTransaction: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  boletos: Boleto[];
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  scope,
  setScope,
  period,
  setPeriod,
  periodOptions,
  onOpenNewTransaction,
  theme,
  onToggleTheme,
  boletos,
  onNavigate,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);

  const tabTitles: Record<string, string> = {
    dashboard: 'Visão executiva',
    cpf: 'Finanças pessoais · CPF',
    cnpj: 'Empresa · CNPJ / MEI',
    salary: 'Salários e Evolução da Renda',
    accounts: 'Contas bancárias',
    cards: 'Cartões de crédito',
    boletos: 'Boletos e contas a pagar',
    debts: 'Dívidas e compromissos',
    planning: 'Planejamento 50/30/20',
    investments: 'Investimentos · CDI & Simulador',
    assets: 'Patrimônio e investimentos',
    documents: 'Central de Documentos & Leitura',
    imports: 'Extratos & Open Finance',
    ai: 'Inteligência Artificial',
    reports: 'Relatórios gerenciais',
    settings: 'Configurações',
  };

  const alertBoletos = boletos.filter((b) => {
    if (b.status === 'PAID') return false;
    const c = calculateCountdown(b.vencimento, false);
    return c.status === 'OVERDUE' || c.status === 'DUE_TODAY' || c.status === 'UPCOMING';
  });

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#e5eaf0] dark:border-slate-800 shadow-xs px-4 md:px-8 select-none">
      <div className="min-h-16 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
            FINANCE IA
          </span>
          <h2 className="text-base md:text-lg font-bold text-[#14263d] dark:text-white truncate">
            {tabTitles[currentTab] || 'Dashboard'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Dynamic Period selector (YYYY-MM) */}
          <select
            aria-label="Período de referência"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer min-h-11"
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <PWAInstallButton compact />

          {/* Desktop Novo Lançamento */}
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="hidden md:flex items-center gap-1.5 bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 min-h-11 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus size={18} />
            Novo lançamento
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            className="min-w-11 min-h-11 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notificações de vencimentos"
              aria-expanded={notifOpen}
              className="min-w-11 min-h-11 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer relative"
            >
              <Bell size={20} />
              {alertBoletos.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 z-50">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-bold text-[#14263d] dark:text-white">
                    Alertas de vencimento ({alertBoletos.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    aria-label="Fechar notificações"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {alertBoletos.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">
                    Nenhum boleto vencido ou próximo do vencimento.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {alertBoletos.map((b) => {
                      const c = calculateCountdown(b.vencimento, false);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            onNavigate('boletos');
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-[#14263d] dark:text-white truncate">
                              {b.beneficiario}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              R$ {b.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${c.badgeColor}`}>
                            {c.shortLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second row: Entity Scope Toggle */}
      <div className="flex items-center justify-between gap-2 pb-3 pt-1">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setScope('CONSOLIDATED')}
            className={`flex-1 sm:flex-none min-h-10 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scope === 'CONSOLIDATED'
                ? 'bg-white dark:bg-slate-900 text-[#14263d] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Consolidado
          </button>
          <button
            type="button"
            onClick={() => setScope('CPF')}
            className={`flex-1 sm:flex-none min-h-10 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scope === 'CPF'
                ? 'bg-white dark:bg-slate-900 text-[#14263d] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            CPF
          </button>
          <button
            type="button"
            onClick={() => setScope('CNPJ')}
            className={`flex-1 sm:flex-none min-h-10 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scope === 'CNPJ'
                ? 'bg-white dark:bg-slate-900 text-[#14263d] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-4 h-4 text-amber-600" />
            CNPJ
          </button>
        </div>
      </div>
    </header>
  );
};
