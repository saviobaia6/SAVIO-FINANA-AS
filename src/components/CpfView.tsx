import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import {
  filterTransactionsByPeriod,
  toCents,
  fromCents,
  formatCurrencyBRL,
} from '../utils/financeCalculations';
import { Search, Plus, Trash2, Pencil } from 'lucide-react';

interface CpfViewProps {
  transactions: Transaction[];
  period: string;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const CpfView: React.FC<CpfViewProps> = ({
  transactions,
  period,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const cpfTrs = useMemo(() => {
    const byEntity = transactions.filter((t) => t.entityId === 'CPF' && t.status !== 'CANCELLED');
    return filterTransactionsByPeriod(byEntity, period);
  }, [transactions, period]);

  const categories = useMemo(() => {
    const set = new Set<string>(cpfTrs.map((t) => t.category));
    return Array.from(set).sort();
  }, [cpfTrs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cpfTrs
      .filter((t) => {
        const matchesSearch =
          !q ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.account.toLowerCase().includes(q);
        const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [cpfTrs, search, selectedCategory]);

  const { totalCpfIncome, totalCpfExpense, netCpf } = useMemo(() => {
    const nonTransfers = cpfTrs.filter((t) => !t.isInternalTransfer);
    const inc = nonTransfers
      .filter((t) => t.direction === 'INCOME')
      .reduce((a, b) => a + toCents(b.amount), 0);
    const exp = nonTransfers
      .filter((t) => t.direction === 'EXPENSE')
      .reduce((a, b) => a + toCents(b.amount), 0);
    return {
      totalCpfIncome: fromCents(inc),
      totalCpfExpense: fromCents(exp),
      netCpf: fromCents(inc - exp),
    };
  }, [cpfTrs]);

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
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md text-[10px] font-bold">
              PESSOAL
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
              Finanças Pessoais · CPF
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Competência: <strong>{period === 'ALL' ? 'Todo período' : period}</strong> · Movimentações vinculadas à pessoa física.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddTransaction}
          className="bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 min-h-11 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo lançamento pessoal
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Entradas CPF</span>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            R$ {formatCurrencyBRL(totalCpfIncome)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Saídas CPF</span>
          <div className="text-xl font-bold text-red-700 dark:text-red-400 mt-1">
            R$ {formatCurrencyBRL(totalCpfExpense)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">Saldo Líquido CPF</span>
          <div className="text-xl font-bold text-[#14263d] dark:text-white mt-1">
            R$ {formatCurrencyBRL(netCpf)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar movimentação pessoal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-800 dark:text-white min-h-12"
          />
        </div>

        <select
          aria-label="Filtrar por categoria"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
        >
          <option value="ALL">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* List / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
            Histórico de lançamentos CPF
          </h3>
          <span className="text-xs text-slate-400">{filtered.length} registros</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum lançamento encontrado para os filtros e período selecionados.
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

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium">
                        {t.category}
                      </span>
                      {t.isInternalTransfer && (
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-md text-[11px] font-medium">
                          Transferência
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(t)}
                        className="min-w-10 min-h-10 grid place-items-center text-slate-500 hover:text-[#14263d] dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
                        aria-label={`Editar ${t.description}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(t)}
                        className="min-w-10 min-h-10 grid place-items-center text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg cursor-pointer"
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
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400">
                        {t.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-800 dark:text-slate-100">
                        {t.description}
                        {t.isInternalTransfer && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Transferência
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-medium">
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
                            className="p-2 text-slate-400 hover:text-[#14263d] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(t)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
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
