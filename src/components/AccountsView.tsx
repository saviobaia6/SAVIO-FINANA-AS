import React, { useState, useMemo } from 'react';
import { Account, Boleto, Transaction } from '../types';
import { toCents, fromCents, parseCurrencyInput, formatCurrencyBRL } from '../utils/financeCalculations';
import { canDeleteAccount, AccountDeletionCheck } from '../services/accountService';
import { Wallet, Plus, CheckCircle2, Trash2, AlertCircle, Archive, ArchiveRestore, Lock } from 'lucide-react';
import { Sheet } from './Sheet';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  boletos?: Boleto[];
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onToggleArchiveAccount: (id: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  boletos,
  onAddAccount,
  onDeleteAccount,
  onToggleArchiveAccount,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<Account['accountType']>('checking');
  const [entityId, setEntityId] = useState<'CPF' | 'CNPJ'>('CPF');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('0,00');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const deletionChecks = useMemo(() => {
    const map = new Map<string, AccountDeletionCheck>();
    for (const acc of accounts) {
      map.set(
        acc.id,
        canDeleteAccount(acc.id, { transactions, boletos, account: acc })
      );
    }
    return map;
  }, [accounts, transactions, boletos]);

  const totalBalance = fromCents(accounts.reduce((acc, a) => acc + toCents(a.balance), 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedOpening = parseCurrencyInput(openingBalanceStr || '0');
    if (!institutionName.trim() || !accountName.trim()) {
      setErrorMsg('Informe o banco/instituição e o nome da conta.');
      return;
    }
    if (isNaN(parsedOpening)) {
      setErrorMsg('Saldo inicial inválido.');
      return;
    }

    onAddAccount({
      entityId,
      institutionName: institutionName.trim(),
      accountName: accountName.trim(),
      accountType,
      openingBalance: parsedOpening,
      balance: parsedOpening,
    });

    setInstitutionName('');
    setAccountName('');
    setOpeningBalanceStr('0,00');
    setModalOpen(false);
  };

  const typeLabels: Record<Account['accountType'], string> = {
    checking: 'Corrente',
    savings: 'Poupança',
    business: 'Empresarial PJ',
    investment: 'Investimento',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
            Contas Bancárias
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Saldo calculado automaticamente pelo saldo inicial somado aos lançamentos vinculados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErrorMsg('');
            setModalOpen(true);
          }}
          className="bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 min-h-11 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova conta
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400">Saldo Consolidado em Contas</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#14263d] dark:text-white mt-1">
            R$ {formatCurrencyBRL(totalBalance)}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl">
          <Wallet className="w-8 h-8" />
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
            Instituições cadastradas ({accounts.length})
          </h3>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold">
            Saldo derivado
          </span>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {accounts.map((acc) => {
            const check = deletionChecks.get(acc.id);
            const txCount = check?.linkedTransactionsCount || 0;
            const blocked = check ? !check.allowed : txCount > 0;
            return (
              <div key={acc.id} className={`p-4 space-y-2 ${acc.archived ? 'opacity-70 bg-slate-50/60 dark:bg-slate-800/30' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{acc.institutionName}</span>
                      {acc.archived && (
                        <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold">
                          Arquivada
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {acc.accountName} · {txCount} lançamento{txCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-base font-extrabold text-[#14263d] dark:text-emerald-400">
                    R$ {formatCurrencyBRL(acc.balance)}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                      {typeLabels[acc.accountType]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.entityId === 'CPF'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {acc.entityId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onToggleArchiveAccount(acc.id);
                        setActionMsg(
                          acc.archived
                            ? `Conta "${acc.institutionName} · ${acc.accountName}" reativada.`
                            : `Conta "${acc.institutionName} · ${acc.accountName}" arquivada (histórico e saldo preservados).`
                        );
                      }}
                      className="min-w-10 min-h-10 grid place-items-center text-slate-500 hover:text-[#14263d] dark:text-slate-400 dark:hover:text-white cursor-pointer"
                      aria-label={acc.archived ? `Reativar ${acc.accountName}` : `Arquivar ${acc.accountName}`}
                      title={acc.archived ? 'Reativar conta' : 'Arquivar conta (oculta em novos lançamentos)'}
                    >
                      {acc.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                    </button>
                    {blocked ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActionMsg(
                            check?.reason ||
                              `Exclusão bloqueada: "${acc.institutionName} · ${acc.accountName}" possui ${txCount} lançamento(s) vinculado(s). Arquive a conta para preservar o histórico sem deixar saldos órfãos.`
                          )
                        }
                        className="min-w-10 min-h-10 grid place-items-center text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        aria-label={`Exclusão bloqueada para ${acc.accountName}`}
                        title={check?.reason || `Possui ${txCount} lançamento(s) — use Arquivar`}
                      >
                        <Lock size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDeleteAccount(acc.id)}
                        className="min-w-10 min-h-10 grid place-items-center text-slate-400 hover:text-red-600 cursor-pointer"
                        aria-label={`Excluir ${acc.accountName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-6 font-semibold">Instituição / Conta</th>
                <th className="py-3 px-6 font-semibold">Tipo</th>
                <th className="py-3 px-6 font-semibold">Vínculo</th>
                <th className="py-3 px-6 font-semibold text-right">Saldo Inicial</th>
                <th className="py-3 px-6 font-semibold text-right">Saldo Atual</th>
                <th className="py-3 px-6 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {accounts.map((acc) => {
                const check = deletionChecks.get(acc.id);
                const txCount = check?.linkedTransactionsCount || 0;
                const blocked = check ? !check.allowed : txCount > 0;
                return (
                  <tr
                    key={acc.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      acc.archived ? 'opacity-70 bg-slate-50/50 dark:bg-slate-800/20' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>{acc.institutionName}</span>
                        {acc.archived && (
                          <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold">
                            Arquivada
                          </span>
                        )}
                      </div>
                      <small className="text-slate-400">
                        {acc.accountName} · {txCount} lançamento{txCount !== 1 ? 's' : ''}
                      </small>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-medium">
                        {typeLabels[acc.accountType]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.entityId === 'CPF'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {acc.entityId}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-400">
                      R$ {formatCurrencyBRL(acc.openingBalance)}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#14263d] dark:text-emerald-400">
                      R$ {formatCurrencyBRL(acc.balance)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onToggleArchiveAccount(acc.id);
                            setActionMsg(
                              acc.archived
                                ? `Conta "${acc.institutionName} · ${acc.accountName}" reativada.`
                                : `Conta "${acc.institutionName} · ${acc.accountName}" arquivada (histórico preservado).`
                            );
                          }}
                          className="p-2 text-slate-500 hover:text-[#14263d] dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
                          title={acc.archived ? 'Reativar conta' : 'Arquivar conta'}
                        >
                          {acc.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                        </button>
                        {blocked ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActionMsg(
                                check?.reason ||
                                  `Exclusão bloqueada: "${acc.institutionName}" possui ${txCount} lançamento(s). Arquive a conta para preservar a integridade dos saldos.`
                              )
                            }
                            className="p-2 text-slate-300 dark:text-slate-600 rounded-lg cursor-not-allowed"
                            title={check?.reason || `Bloqueada (${txCount} lançamentos) — use Arquivar`}
                          >
                            <Lock size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDeleteAccount(acc.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Excluir conta sem lançamentos"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Sheet */}
      <Sheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova conta bancária"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Instituição / Banco
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: Banco Inter, Nubank, Caixa"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Nome da conta
            </label>
            <input
              type="text"
              required
              placeholder="Ex.: Conta Corrente, Conta PJ"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Tipo
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as Account['accountType'])}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
              >
                <option value="checking">Corrente</option>
                <option value="savings">Poupança</option>
                <option value="business">Empresarial PJ</option>
                <option value="investment">Investimento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Vínculo
              </label>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value as 'CPF' | 'CNPJ')}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Saldo inicial (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={openingBalanceStr}
              onChange={(e) => setOpeningBalanceStr(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 min-h-12 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[1.5] min-h-12 bg-[#14263d] dark:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} /> Salvar conta
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
};
