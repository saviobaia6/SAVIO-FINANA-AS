import React, { useState, useMemo } from 'react';
import { Transaction, Boleto } from '../types';
import { GoogleWorkspacePanel } from './GoogleWorkspacePanel';
import {
  AppDataset,
  FullBackupPayload,
  ParsedBackupPreview,
  PreResetSnapshot,
  buildFullBackup,
  buildFullBackupWithFileRefs,
  getBackupCounts,
  parseAndValidateBackup,
  downloadTransactionsCsv,
} from '../services/backupService';
import { todayLocal, formatDateBR } from '../utils/dateUtils';
import {
  CorruptBackupInfo,
  listCorruptBackups,
  readRawKeySafe,
  removeRawKeySafe,
  storageService,
} from '../services/storage';
import {
  ShieldCheck,
  Database,
  RefreshCw,
  Sun,
  Moon,
  Sliders,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  History,
  FileWarning,
  Trash2,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { Sheet } from './Sheet';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  dataset: AppDataset;
  transactions: Transaction[];
  boletos: Boleto[];
  preResetSnapshot: PreResetSnapshot | null;
  onImportBackup: (
    payload: FullBackupPayload,
    mode: 'replace' | 'merge'
  ) => { ok: boolean; error?: string } | void;
  onRestoreSnapshot: () => void;
  onResetData: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  density: 'compact' | 'standard' | 'enlarged';
  setDensity: (density: 'compact' | 'standard' | 'enlarged') => void;
  zoom: string;
  setZoom: (zoom: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  dataset,
  transactions,
  boletos,
  preResetSnapshot,
  onImportBackup,
  onRestoreSnapshot,
  onResetData,
  theme,
  setTheme,
  density,
  setDensity,
  zoom,
  setZoom,
}) => {
  const [importPreview, setImportPreview] = useState<ParsedBackupPreview | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [backupMsg, setBackupMsg] = useState('');
  const [backupError, setBackupError] = useState('');
  const [corruptBackups, setCorruptBackups] = useState<CorruptBackupInfo[]>(() =>
    listCorruptBackups()
  );
  const [resetSheetOpen, setResetSheetOpen] = useState(false);

  const fullBackup = useMemo(() => buildFullBackup(dataset), [dataset]);
  const currentCounts = useMemo(() => getBackupCounts(dataset), [dataset]);

  const handleExportFullBackup = async () => {
    setBackupError('');
    const payload = await buildFullBackupWithFileRefs(dataset);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FINANCE_IA_Backup_Completo_${todayLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Backup completo exportado (.json) com todos os módulos, referências de arquivos e preferências visuais.');
  };

  const handleExportCsv = () => {
    setBackupError('');
    downloadTransactionsCsv(transactions);
    setBackupMsg(`${transactions.length} lançamento(s) exportado(s) para planilha CSV (compatível com Excel).`);
  };

  const handleSelectBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBackupMsg('');
    setBackupError('');
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const parsed = parseAndValidateBackup(content, dataset);
      if (!parsed.valid) {
        setImportPreview(null);
        setBackupError(parsed.error || 'Arquivo de backup inválido.');
        return;
      }
      setImportPreview(parsed);
    };
    reader.onerror = () => {
      setBackupError('Não foi possível ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const confirmBackupImport = () => {
    if (!importPreview?.valid || !importPreview.payload) return;
    const result = onImportBackup(importPreview.payload, importMode);
    if (result && !result.ok) {
      setBackupError(
        result.error ||
          'Falha de integridade durante a restauração. Os dados anteriores foram mantidos via rollback.'
      );
      return;
    }
    setImportPreview(null);
    setImportFileName('');
    setBackupMsg(
      importMode === 'replace'
        ? 'Backup restaurado por completo (snapshot automático de segurança salvo antes da substituição).'
        : 'Registros do backup mesclados sem sobrescrever itens existentes.'
    );
  };

  const handleDownloadCorruptCopy = (item: CorruptBackupInfo) => {
    const raw = readRawKeySafe(item.key);
    if (!raw) return;
    const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.key}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
            Configurações & Ergonomia
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Backup completo com pré-visualização, recuperação automática, tema, densidade e Google Workspace.
          </p>
        </div>
        <PWAInstallButton />
      </div>

      {/* Ergonomics & Appearance Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" /> Aparência & Ergonomia Multidispositivo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

      {/* Full Backup Export / Import with Preview & Snapshot */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" /> Backup Completo & Recuperação Segura
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Inclui contas ({currentCounts.accounts}), lançamentos ({currentCounts.transactions}), cartões ({currentCounts.creditCards}), boletos ({currentCounts.boletos}), dívidas ({currentCounts.debts}), bens ({currentCounts.assets}) e metadados de documentos ({currentCounts.documents}).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportFullBackup}
              className="px-4 min-h-11 bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Download size={15} /> Exportar backup (.json)
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 min-h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Exportar lançamentos (.csv)
            </button>

            <label className="px-4 min-h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
              <Upload size={15} /> Importar backup (.json)
              <input type="file" accept=".json,application/json" onChange={handleSelectBackupFile} className="hidden" />
            </label>
          </div>
        </div>

        {backupMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{backupMsg}</span>
          </div>
        )}

        {backupError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{backupError}</span>
          </div>
        )}

        {/* Import Preview */}
        {importPreview?.valid && importPreview.payload && importPreview.counts && (
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-[#14263d] dark:text-white">
                  Pré-visualização do Backup: {importFileName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Exportado em: {new Date(importPreview.payload.exportedAt).toLocaleString('pt-BR')} · Schema v{importPreview.payload.schemaVersion}
                  {importPreview.periodRange && (
                    <> · Período: {formatDateBR(importPreview.periodRange.start)} a {formatDateBR(importPreview.periodRange.end)}</>
                  )}
                </p>
                {(importPreview.duplicateTransactionsCount || importPreview.duplicateAccountsCount) ? (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">
                    Duplicidades detectadas em relação ao sistema atual: {importPreview.duplicateTransactionsCount || 0} lançamento(s) e {importPreview.duplicateAccountsCount || 0} conta(s). No modo Mesclar, registros idênticos são ignorados automaticamente.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setImportPreview(null);
                  setImportFileName('');
                }}
                className="px-3 min-h-9 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {importPreview.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                {importPreview.warnings.map((w, idx) => (
                  <div key={idx}>{w}</div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              {[
                { label: 'Contas', value: importPreview.counts.accounts },
                { label: 'Lançamentos', value: importPreview.counts.transactions },
                { label: 'Cartões', value: importPreview.counts.creditCards },
                { label: 'Boletos', value: importPreview.counts.boletos },
                { label: 'Dívidas', value: importPreview.counts.debts },
                { label: 'Patrimônio', value: importPreview.counts.assets },
                { label: 'Docs', value: importPreview.counts.documents },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-center"
                >
                  <div className="text-[11px] text-slate-400">{stat.label}</div>
                  <div className="text-base font-extrabold text-[#14263d] dark:text-white">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="backup-import-mode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-emerald-600"
                  />
                  Mesclar novos registros (preserva atuais)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="backup-import-mode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-emerald-600"
                  />
                  Substituir tudo (salva snapshot antes)
                </label>
              </div>

              <button
                type="button"
                onClick={confirmBackupImport}
                className="px-5 min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer shrink-0"
              >
                Confirmar Importação
              </button>
            </div>
          </div>
        )}

        {/* Pre-reset snapshot recovery */}
        {preResetSnapshot && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <History size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-[#14263d] dark:text-white">
                  Snapshot automático disponível ({preResetSnapshot.reason === 'reset' ? 'pré-reset' : 'pré-restauração'})
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Salvo em {new Date(preResetSnapshot.savedAt).toLocaleString('pt-BR')} ·{' '}
                  {preResetSnapshot.backup.data.transactions.length} lançamentos ·{' '}
                  {preResetSnapshot.backup.data.accounts.length} contas
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onRestoreSnapshot();
                setBackupMsg('Snapshot anterior restaurado com sucesso!');
              }}
              className="px-4 min-h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
            >
              Restaurar snapshot anterior
            </button>
          </div>
        )}

        {/* Corrupted payload copies preserved by storage.ts */}
        {corruptBackups.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <FileWarning size={16} /> Cópias preservadas de leituras corrompidas ({corruptBackups.length})
            </div>
            <div className="space-y-1.5">
              {corruptBackups.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 text-xs bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-xl">
                  <span className="truncate font-mono text-slate-700 dark:text-slate-300">
                    {item.sourceKey} ({item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : 'sem data'})
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const restored = storageService.restore(item.sourceKey);
                        if (restored) {
                          setBackupMsg(
                            `Cópia restaurada para "${item.sourceKey}". Recarregue a página para aplicar os dados recuperados.`
                          );
                        } else {
                          setBackupError(
                            `Não foi possível restaurar "${item.sourceKey}" automaticamente porque o JSON original está sintaticamente corrompido. Use "Baixar" para inspeção.`
                          );
                        }
                      }}
                      className="px-2.5 min-h-8 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Restaurar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadCorruptCopy(item)}
                      className="px-2.5 min-h-8 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Baixar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeRawKeySafe(item.key);
                        setCorruptBackups(listCorruptBackups());
                      }}
                      className="min-w-8 min-h-8 grid place-items-center text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label="Descartar cópia"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Google Workspace Integration Panel */}
      <GoogleWorkspacePanel transactions={transactions} boletos={boletos} fullBackup={fullBackup} />

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
            <RefreshCw className="w-4 h-4 text-slate-500" /> Reinicialização Segura
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Ao restaurar os dados iniciais de demonstração, um snapshot automático dos seus registros atuais é salvo antes da limpeza para permitir reversão imediata.
          </p>
          <button
            type="button"
            onClick={() => setResetSheetOpen(true)}
            className="px-4 min-h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restaurar dados iniciais de demonstração
          </button>
        </div>
      </div>

      <Sheet
        open={resetSheetOpen}
        onClose={() => setResetSheetOpen(false)}
        title="Confirmar reinicialização segura"
        subtitle="Um snapshot automático dos seus dados atuais será salvo antes da limpeza"
        headerVariant="danger"
      >
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          Esta ação substituirá os lançamentos, contas, cartões, boletos, dívidas e documentos atuais pelos dados iniciais de demonstração.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Se precisar desfazer, o botão <strong>Restaurar snapshot anterior</strong> ficará disponível nesta tela imediatamente após o reset.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setResetSheetOpen(false)}
            className="flex-1 min-h-12 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              setResetSheetOpen(false);
              onResetData();
            }}
            className="flex-[1.4] min-h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold cursor-pointer"
          >
            Criar snapshot e resetar
          </button>
        </div>
      </Sheet>
    </div>
  );
};
