import React, { useState, useEffect } from 'react';
import { 
  signInWithGoogleWorkspace, 
  getWorkspaceAccessToken, 
  exportToGoogleSheets, 
  syncBoletoToCalendar, 
  backupToGoogleDrive 
} from '../services/googleWorkspace';
import { FileSpreadsheet, Calendar, HardDrive, CheckCircle2, ShieldCheck, LogOut } from 'lucide-react';

interface GoogleWorkspacePanelProps {
  transactions: any[];
  boletos: any[];
}

export const GoogleWorkspacePanel: React.FC<GoogleWorkspacePanelProps> = ({ transactions, boletos }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const activeToken = getWorkspaceAccessToken();
    if (activeToken) {
      setToken(activeToken);
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await signInWithGoogleWorkspace();
      setUser(res.user);
      setToken(res.accessToken);
      setStatusMessage('Autenticado com sucesso no Google Workspace!');
    } catch (err: any) {
      console.error(err);
      alert('Erro na autenticação com Google Workspace: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportSheets = async () => {
    if (!token) return alert('Faça login com Google Workspace primeiro.');
    setLoading(true);
    try {
      const url = await exportToGoogleSheets(token, transactions);
      setStatusMessage('Planilha criada com sucesso no Google Sheets!');
      window.open(url, '_blank');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao exportar para o Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCalendar = async (boleto: any) => {
    if (!token) return alert('Faça login com Google Workspace primeiro.');
    if (!window.confirm(`Deseja adicionar o vencimento de "${boleto.beneficiario}" ao seu Google Calendar?`)) return;
    setLoading(true);
    try {
      await syncBoletoToCalendar(token, boleto);
      setStatusMessage(`Vencimento de ${boleto.beneficiario} adicionado ao Google Calendar!`);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao sincronizar com Google Calendar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDriveBackup = async () => {
    if (!token) return alert('Faça login com Google Workspace primeiro.');
    setLoading(true);
    try {
      await backupToGoogleDrive(token, { transactions, boletos });
      setStatusMessage('Backup financeiro salvo com sucesso no Google Drive!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar backup no Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">GOOGLE WORKSPACE</span>
            <h3 className="text-lg font-extrabold text-[#14263d]">Integração 1P · Drive, Sheets & Calendar</h3>
          </div>
          <p className="text-xs text-slate-500">
            Conecte sua conta Google para exportar planilhas, agendar compromissos financeiros e fazer backup seguro.
          </p>
        </div>

        {!token ? (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="gsi-material-button bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-3 transition-all cursor-pointer"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>Sign in with Google Workspace</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Conectado com Google Workspace</span>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {statusMessage}
        </div>
      )}

      {token && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Google Sheets
              </div>
              <p className="text-[11px] text-slate-500">Exportar todas as transações ativas para uma planilha Google Sheets automática.</p>
            </div>
            <button
              onClick={handleExportSheets}
              disabled={loading}
              className="w-full py-2 bg-[#14263d] text-white rounded-xl text-xs font-bold hover:bg-[#1d3552] transition-colors"
            >
              Exportar para Sheets
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-1">
                <HardDrive className="w-4 h-4 text-blue-600" /> Google Drive
              </div>
              <p className="text-[11px] text-slate-500">Salvar um backup criptografado em JSON de todo o banco de dados no Google Drive.</p>
            </div>
            <button
              onClick={handleDriveBackup}
              disabled={loading}
              className="w-full py-2 bg-[#14263d] text-white rounded-xl text-xs font-bold hover:bg-[#1d3552] transition-colors"
            >
              Fazer Backup no Drive
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-1">
                <Calendar className="w-4 h-4 text-amber-600" /> Google Calendar
              </div>
              <p className="text-[11px] text-slate-500">Sincronizar vencimentos de boletos pendentes diretamente com sua agenda.</p>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {boletos.filter((b: any) => b.status === 'PENDING').slice(0, 2).map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => handleSyncCalendar(b)}
                  className="w-full text-left px-2 py-1 bg-white hover:bg-amber-50 border border-slate-200 rounded text-[10px] truncate text-slate-700"
                >
                  📅 Sincronizar: {b.beneficiario} ({b.vencimento})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
