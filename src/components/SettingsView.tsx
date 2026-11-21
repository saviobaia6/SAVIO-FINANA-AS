import React, { useState, useEffect } from 'react';
import { GoogleWorkspacePanel } from './GoogleWorkspacePanel';
import { Settings as SettingsIcon, ShieldCheck, Database, RefreshCw, Sun, Moon, Sliders, ZoomIn } from 'lucide-react';

interface SettingsViewProps {
  transactions: any[];
  boletos: any[];
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ transactions, boletos, onResetData }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('finance_ia_theme') as 'light' | 'dark' || 'light';
  });

  const [density, setDensity] = useState<'compact' | 'standard' | 'enlarged'>(() => {
    return localStorage.getItem('finance_ia_density') as any || 'standard';
  });

  const [zoom, setZoom] = useState<string>(() => {
    return localStorage.getItem('finance_ia_zoom') || '100%';
  });

  useEffect(() => {
    localStorage.setItem('finance_ia_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('finance_ia_density', density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem('finance_ia_zoom', zoom);
    document.body.style.zoom = zoom;
  }, [zoom]);

  return (
    <div className="space-y-6 animate-fadeIn pb-20 md:pb-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#14263d] dark:text-white">Configurações & Ergonomia</h2>
        <p className="text-xs text-slate-500">
          Ajustes de tema (claro/escuro), densidade visual, zoom da interface, integração Google Workspace e LGPD.
        </p>
      </div>

      {/* Ergonomics & Appearance Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" /> Aparência & Ergonomia Multidispositivo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Theme Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Tema da Interface</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-[#14263d] text-white border-[#14263d]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" /> Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-300" /> Escuro
              </button>
            </div>
          </div>

          {/* Display Density */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Modo de Densidade</label>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value as any)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="compact">Compacto</option>
              <option value="standard">Padrão</option>
              <option value="enlarged">Ampliado</option>
            </select>
          </div>

          {/* Zoom Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Zoom da Interface</label>
            <select
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500"
            >
              <option value="75%">75% (Compacto)</option>
              <option value="90%">90%</option>
              <option value="100%">100% (Padrão)</option>
              <option value="110%">110%</option>
              <option value="125%">125% (Ampliado)</option>
              <option value="150%">150% (Alta Acessibilidade)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Google Workspace Integration Panel */}
      <GoogleWorkspacePanel transactions={transactions} boletos={boletos} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Privacidade e LGPD
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            O SAVIO FINANÇAS respeita estritamente a LGPD. Não solicitamos nem armazenamos senhas bancárias, CVV ou números completos de cartões. Todos os dados sensíveis são mascarados.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-600" /> Banco de Dados & Sincronização
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Dados persistidos localmente com sincronização pronta para PostgreSQL e Supabase via Drizzle ORM.
          </p>
          <button
            onClick={() => {
              if (window.confirm('Deseja restaurar os dados iniciais de demonstração?')) {
                onResetData();
              }
            }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restaurar dados de demonstração padrão
          </button>
        </div>
      </div>
    </div>
  );
};
