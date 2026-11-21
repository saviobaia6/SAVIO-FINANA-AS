import React from 'react';
import { GoogleWorkspacePanel } from './GoogleWorkspacePanel';
import { Settings as SettingsIcon, ShieldCheck, Database, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  transactions: any[];
  boletos: any[];
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ transactions, boletos, onResetData }) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-20 md:pb-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#14263d]">Configurações & Google Workspace</h2>
        <p className="text-xs text-slate-500">
          Gerenciamento de integrações Google (Drive, Sheets, Calendar), LGPD e banco de dados.
        </p>
      </div>

      {/* Google Workspace Integration Panel */}
      <GoogleWorkspacePanel transactions={transactions} boletos={boletos} />

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#14263d] flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Privacidade e LGPD
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            O FINANCE IA respeita estritamente a LGPD. Não solicitamos nem armazenamos senhas bancárias, CVV ou números completos de cartões. Todos os dados sensíveis são mascarados.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-[#14263d] flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-600" /> Banco de Dados & Sincronização
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Dados persistidos localmente com suporte a Supabase e PostgreSQL via esquemas relacionais dedicados.
          </p>
          <button
            onClick={() => {
              if (window.confirm('Deseja restaurar os dados iniciais de demonstração?')) {
                onResetData();
              }
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restaurar dados de demonstração padrão
          </button>
        </div>
      </div>
    </div>
  );
};
