import React from 'react';
import { Transaction, Boleto } from '../types';
import { GoogleWorkspacePanel } from './GoogleWorkspacePanel';
import { ShieldCheck, Database, RefreshCw, Sun, Moon, Sliders } from 'lucide-react';

interface SettingsViewProps {
  transactions: Transaction[];
  boletos: Boleto[];
  onResetData: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  density: 'compact' | 'standard' | 'enlarged';
  setDensity: (density: 'compact' | 'standard' | 'enlarged') => void;
  zoom: string;
  setZoom: (zoom: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  transactions,
  boletos,
  onResetData,
  theme,
  setTheme,
  density,
  setDensity,
  zoom,
  setZoom,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
          Configurações & Ergonomia
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Ajustes de tema (claro/escuro), densidade, escala tipográfica, Google Workspace e privacidade.
        </p>
      </div>

      {/* Ergonomics & Appearance Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" /> Aparência & Ergonomia Multidispositivo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Theme Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Tema da Interface
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`min-h-12 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#14263d] text-white border-[#14263d]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" /> Claro
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`min-h-12 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-300" /> Escuro
              </button>
            </div>
          </div>

          {/* Display Density */}
          <div>
            <label htmlFor="cfg-density" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Modo de Densidade
            </label>
            <select
              id="cfg-density"
              value={density}
              onChange={(e) => setDensity(e.target.value as 'compact' | 'standard' | 'enlarged')}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
            >
              <option value="compact">Compacto</option>
              <option value="standard">Padrão</option>
              <option value="enlarged">Ampliado</option>
            </select>
          </div>

          {/* Font Scale / Zoom */}
          <div>
            <label htmlFor="cfg-zoom" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Escala da Interface (acessibilidade)
            </label>
            <select
              id="cfg-zoom"
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
            >
              <option value="87.5%">87,5% (Compacto)</option>
              <option value="100%">100% (Padrão)</option>
              <option value="112.5%">112,5% (Ampliado)</option>
              <option value="125%">125% (Alta Legibilidade)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Google Workspace Integration Panel */}
      <GoogleWorkspacePanel transactions={transactions} boletos={boletos} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Privacidade e LGPD
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            O FINANCE IA nunca solicita ou armazena senhas bancárias, código de segurança (CVV) ou número completo de cartões de crédito — apenas os 4 últimos dígitos para identificação.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-600" /> Armazenamento Atual & Roadmap
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Nesta etapa (Fase 0), seus registros são salvos localmente no navegador. A persistência em servidor com PostgreSQL, Drizzle ORM e autenticação por sessão será implantada na Fase 1.
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja restaurar os dados iniciais de demonstração?')) {
                onResetData();
              }
            }}
            className="px-4 min-h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restaurar dados iniciais de demonstração
          </button>
        </div>
      </div>
    </div>
  );
};
