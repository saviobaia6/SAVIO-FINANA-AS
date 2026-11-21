import React, { useMemo, useState } from 'react';
import { Transaction, Boleto } from '../types';
import {
  filterTransactionsByPeriod,
  toCents,
  fromCents,
  formatCurrencyBRL,
} from '../utils/financeCalculations';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface CnpjViewProps {
  transactions: Transaction[];
  boletos: Boleto[];
  period: string;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const CnpjView: React.FC<CnpjViewProps> = ({
  transactions,
  boletos,
  period,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');

  const cnpjTrs = useMemo(() => {
    const byEntity = transactions.filter((t) => t.entityId === 'CNPJ' && t.status !== 'CANCELLED');
    return filterTransactionsByPeriod(byEntity, period).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, period]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cnpjTrs;
    return cnpjTrs.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q)
    );
  }, [cnpjTrs, search]);

  const { totalCnpjIncome, totalCnpjExpense, operationalResult } = useMemo(() => {
    const nonTransfers = cnpjTrs.filter((t) => !t.isInternalTransfer);
    const inc = nonTransfers
      .filter((t) => t.direction === 'INCOME')
      .reduce((a, b) => a + toCents(b.amount), 0);
    const exp = nonTransfers
      .filter((t) => t.direction === 'EXPENSE')
      .reduce((a, b) => a + toCents(b.amount), 0);
    return {
      totalCnpjIncome: fromCents(inc),
      totalCnpjExpense: fromCents(exp),
      operationalResult: fromCents(inc - exp),
    };
  }, [cnpjTrs]);

  const pendingCnpjBoletos = useMemo(() => {
    return boletos.filter((b) => b.entityId === 'CNPJ' && b.status === 'PENDING');
  }, [boletos]);

  const totalPendingCnpjBoletos = useMemo(() => {
    return fromCents(pendingCnpjBoletos.reduce((acc, b) => acc + toCents(b.valorOriginal), 0));
  }, [pendingCnpjBoletos]);

  const cnpjRevenues = useMemo(() => {
    return cnpjTrs.filter((t) => t.direction === 'INCOME' && !t.isInternalTransfer);
  }, [cnpjTrs]);

  const confirmDelete = (t: Transaction) => {
    if (window.confirm(`Deseja excluir o lançamento "${t.description}"?`)) {
      onDeleteTransaction(t.id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md text-[10px] font-bold">
              EMPRESA · MEI
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
              Empresa · CNPJ
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Competência: <strong>{period === 'ALL' ? 'Todo período' : period}</strong> · Controle separado das movimentações empresariais.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTransaction}
          className="bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 min-h-11 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar movimentação CNPJ
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
        <span>
          <strong>Regra de Separação:</strong> Transferências entre contas próprias não são somadas como faturamento.
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Receita CNPJ</span>
          <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1.5">
            R$ {formatCurrencyBRL(totalCnpjIncome)}
          </div>
          <small className="text-[11px] text-slate-400 mt-1 block">Faturamento do período</small>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Despesas PJ</span>
          <div className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-400 mt-1.5">
            R$ {formatCurrencyBRL(totalCnpjExpense)}
          </div>
          <small className="text-[11px] text-slate-400 mt-1 block">Custos e insumos</small>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Resultado operacional</span>
          <div className="text-lg sm:text-2xl font-bold text-[#14263d] dark:text-white mt-1.5">
            R$ {formatCurrencyBRL(operationalResult)}
          </div>
          <small className="text-[11px] text-slate-400 mt-1 block">Receitas menos despesas</small>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('boletos')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl hover:border-amber-400 transition-colors cursor-pointer"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400">Obrigações / Boletos PJ</span>
          <div className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1.5">
            R$ {formatCurrencyBRL(totalPendingCnpjBoletos)}
          </div>
          <small className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 block">
            {pendingCnpjBoletos.length} pendente{pendingCnpjBoletos.length !== 1 ? 's' : ''}
          </small>
        </button>
      </div>

      {/* Real revenues & obligations derived from state */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
              Entradas de serviços e vendas (período)
            </h3>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
              CNPJ
            </span>
          </div>
          {cnpjRevenues.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Nenhuma receita CNPJ registrada neste período.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {cnpjRevenues.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{r.description}</p>
                    <small className="text-slate-400">
                      {r.date.split('-').reverse().join('/')} · {r.category}
                    </small>
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    R$ {formatCurrencyBRL(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#14263d] dark:text-white">Boletos e guias PJ pendentes</h3>
            <button
              type="button"
              onClick={() => onNavigate('boletos')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Ver em Boletos
            </button>
          </div>
          {pendingCnpjBoletos.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Nenhuma guia ou boleto PJ pendente no momento.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {pendingCnpjBoletos.map((b) => (
                <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{b.beneficiario}</p>
                    <small className="text-slate-400">
                      Vencimento: {b.vencimento.split('-').reverse().join('/')}
                    </small>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-md font-bold shrink-0">
                    R$ {formatCurrencyBRL(b.valorOriginal)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Search + Transactions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
            Movimentações empresariais ({filtered.length})
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar movimentação PJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-800 dark:text-white outline-none focus:border-emerald-500 min-h-11"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma movimentação CNPJ encontrada no período selecionado.
          </div>
        ) : (
          <>
            {/* Mobile Vertical Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t) => (
                <div key={t.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {t.description}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.date.split('-').reverse().join('/')} · {t.account}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-extrabold shrink-0 ${
                        t.direction === 'INCOME'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {t.direction === 'INCOME' ? '+ ' : '− '}
                      R$ {formatCurrencyBRL(t.amount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                      {t.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(t)}
                        className="min-w-10 min-h-10 grid place-items-center text-slate-500 hover:text-[#14263d] dark:text-slate-400 dark:hover:text-white cursor-pointer"
                        aria-label={`Editar ${t.description}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(t)}
                        className="min-w-10 min-h-10 grid place-items-center text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer"
                        aria-label={`Excluir ${t.description}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-6 font-semibold">Data</th>
                    <th className="py-3 px-6 font-semibold">Descrição</th>
                    <th className="py-3 px-6 font-semibold">Categoria</th>
                    <th className="py-3 px-6 font-semibold">Conta</th>
                    <th className="py-3 px-6 font-semibold text-right">Valor</th>
                    <th className="py-3 px-6 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400">
                        {t.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-800 dark:text-slate-100">
                        {t.description}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-medium">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">{t.account}</td>
                      <td
                        className={`py-3.5 px-6 text-right font-bold ${
                          t.direction === 'INCOME'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {t.direction === 'INCOME' ? '+ ' : '− '}
                        R$ {formatCurrencyBRL(t.amount)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(t)}
                            className="p-2 text-slate-400 hover:text-[#14263d] dark:hover:text-white rounded-lg cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(t)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
