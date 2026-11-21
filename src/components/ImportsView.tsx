import React, { useState } from 'react';
import { Account, Transaction } from '../types';
import {
  checkDuplicateTransaction,
  parseCurrencyInput,
  formatCurrencyBRL,
} from '../utils/financeCalculations';
import { todayLocal } from '../utils/dateLocal';
import { Upload, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface ImportsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onImportTransactions: (items: Omit<Transaction, 'id'>[]) => void;
}

interface ParsedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  direction: 'INCOME' | 'EXPENSE';
  category: string;
  isDuplicate: boolean;
  selected: boolean;
}

function parseSimpleCsv(text: string): Omit<ParsedRow, 'id' | 'isDuplicate' | 'selected'>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const rows: Omit<ParsedRow, 'id' | 'isDuplicate' | 'selected'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 3) continue;

    // Try finding date (YYYY-MM-DD or DD/MM/YYYY), description, and numeric value
    let dateStr = todayLocal();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cols[0])) {
      dateStr = cols[0];
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(cols[0])) {
      const [d, m, y] = cols[0].split('/');
      dateStr = `${y}-${m}-${d}`;
    }

    const rawAmt = cols[cols.length - 1];
    const parsedNum = parseCurrencyInput(rawAmt);
    if (isNaN(parsedNum) || parsedNum === 0) continue;

    rows.push({
      date: dateStr,
      description: cols[1] || 'Lançamento importado',
      amount: Math.abs(parsedNum),
      direction: parsedNum >= 0 ? 'INCOME' : 'EXPENSE',
      category: 'Outros',
    });
  }
  return rows;
}

function parseBasicOfx(text: string): Omit<ParsedRow, 'id' | 'isDuplicate' | 'selected'>[] {
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const rows: Omit<ParsedRow, 'id' | 'isDuplicate' | 'selected'>[] = [];

  blocks.forEach((block) => {
    const dtMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const amtMatch = block.match(/<TRNAMT>([-+]?\d+[.,]?\d*)/i);
    const memoMatch = block.match(/<MEMO>([^\r\n<]+)/i) || block.match(/<NAME>([^\r\n<]+)/i);

    if (!amtMatch) return;
    const rawVal = Number(amtMatch[1].replace(',', '.'));
    if (isNaN(rawVal) || rawVal === 0) return;

    let dateStr = todayLocal();
    if (dtMatch) {
      const s = dtMatch[1];
      dateStr = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    }

    rows.push({
      date: dateStr,
      description: (memoMatch?.[1] || 'Movimento OFX').trim(),
      amount: Math.abs(rawVal),
      direction: rawVal >= 0 ? 'INCOME' : 'EXPENSE',
      category: 'Outros',
    });
  });

  return rows;
}

export const ImportsView: React.FC<ImportsViewProps> = ({
  accounts,
  transactions,
  onImportTransactions,
}) => {
  const activeAccounts = accounts.filter((a) => !a.archived);
  const [fileName, setFileName] = useState('');
  const [targetAccountId, setTargetAccountId] = useState(activeAccounts[0]?.id || accounts[0]?.id || '');
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setStatusMsg('');
    setFileName(file.name);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.ofx')) {
      setErrorMsg('Nesta etapa, a pré-visualização local suporta arquivos .csv e .ofx.');
      setPreviewRows([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const parsed = lower.endsWith('.ofx') ? parseBasicOfx(content) : parseSimpleCsv(content);
      if (parsed.length === 0) {
        setErrorMsg('Não foi possível identificar lançamentos válidos neste arquivo.');
        setPreviewRows([]);
        return;
      }

      const withDup = parsed.map((row, idx) => {
        const dup = checkDuplicateTransaction(transactions, row);
        return {
          ...row,
          id: `imp-${idx}`,
          isDuplicate: dup,
          selected: !dup,
        };
      });
      setPreviewRows(withDup);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const acc = activeAccounts.find((a) => a.id === targetAccountId) || activeAccounts[0];
    if (!acc) {
      setErrorMsg('Selecione uma conta bancária ativa de destino.');
      return;
    }

    const chosen = previewRows.filter((r) => r.selected);
    if (chosen.length === 0) {
      setErrorMsg('Selecione ao menos um lançamento para importar.');
      return;
    }

    const payload: Omit<Transaction, 'id'>[] = chosen.map((r) => ({
      entityId: acc.entityId,
      accountId: acc.id,
      date: r.date,
      description: r.description,
      category: r.category,
      account: `${acc.institutionName} · ${acc.accountName}`,
      amount: r.amount,
      direction: r.direction,
      status: 'CONFIRMED',
      origin: 'IMPORT',
    }));

    onImportTransactions(payload);
    setStatusMsg(`${payload.length} lançamento(s) importado(s) com sucesso na conta ${acc.institutionName}!`);
    setPreviewRows([]);
    setFileName('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
          Extratos & Importação OFX/CSV
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Importação com pré-visualização, deduplicação por data/valor/descrição e vínculo direto com conta bancária.
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
            Importar extrato (.ofx ou .csv)
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Conta de destino dos lançamentos
            </label>
            <select
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.institutionName} · {a.accountName} ({a.entityId})
                </option>
              ))}
            </select>
          </div>

          <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              {fileName || 'Clique para selecionar extrato (.ofx ou .csv)'}
            </span>
            <input type="file" accept=".ofx,.csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
              Sincronização Automática DDA & Open Finance
            </h3>
            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md text-[10px] font-bold">
              Em breve (Fase 5)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A busca automática de boletos DDA e extratos Open Finance depende de integração bancária contratada e backend dedicado. Nenhuma credencial bancária é armazenada no navegador.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Lock size={15} className="shrink-0" />
            <span>Contingência manual via OFX, CSV e leitura de boletos já está 100% operacional.</span>
          </div>
        </div>
      </div>

      {/* Preview Before Saving */}
      {previewRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
                Pré-visualização ({previewRows.length} lançamentos detectados)
              </h3>
              <p className="text-xs text-slate-400">
                Possíveis duplicatas são desmarcadas automaticamente para sua revisão.
              </p>
            </div>
            <button
              type="button"
              onClick={confirmImport}
              className="px-5 min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Confirmar Importação ({previewRows.filter((r) => r.selected).length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {previewRows.map((row) => (
              <label
                key={row.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(e) =>
                      setPreviewRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id ? { ...item, selected: e.target.checked } : item
                        )
                      )
                    }
                    className="w-5 h-5 min-h-5 accent-emerald-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {row.description}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{row.date.split('-').reverse().join('/')}</span>
                      {row.isDuplicate && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                          Possível duplicidade
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-sm font-extrabold shrink-0 ${
                    row.direction === 'INCOME'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {row.direction === 'INCOME' ? '+ ' : '− '}
                  R$ {formatCurrencyBRL(row.amount)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
