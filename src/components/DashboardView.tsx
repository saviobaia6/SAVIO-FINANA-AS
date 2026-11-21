import React, { useMemo } from 'react';
import { Transaction, EntityScope, Boleto, Account, CreditCard } from '../types';
import { calculateCountdown } from '../utils/countdown';
import {
  filterTransactionsByPeriod,
  toCents,
  fromCents,
  formatCurrencyBRL,
} from '../utils/financeCalculations';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Wallet,
  CreditCard as CreditCardIcon,
  Camera,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: Account[];
  boletos: Boleto[];
  cards: CreditCard[];
  scope: EntityScope;
  period: string;
  onNavigate: (tab: string) => void;
  onOpenNew: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  accounts,
  boletos,
  cards,
  scope,
  period,
  onNavigate,
  onOpenNew,
  onEditTransaction,
}) => {
  const scopedAccounts = useMemo(() => {
    return accounts.filter((a) => (scope === 'CONSOLIDATED' ? true : a.entityId === scope));
  }, [accounts, scope]);

  const totalBalance = useMemo(() => {
    const cents = scopedAccounts.reduce((sum, a) => sum + toCents(a.balance), 0);
    return fromCents(cents);
  }, [scopedAccounts]);

  const scopedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status === 'CANCELLED') return false;
      if (scope === 'CPF') return t.entityId === 'CPF';
      if (scope === 'CNPJ') return t.entityId === 'CNPJ';
      return true;
    });
  }, [transactions, scope]);

  const periodTransactions = useMemo(() => {
    return filterTransactionsByPeriod(scopedTransactions, period);
  }, [scopedTransactions, period]);

  const { totalIncome, totalExpense, netResult, preservationRate } = useMemo(() => {
    const nonTransfers = periodTransactions.filter((t) => !t.isInternalTransfer);
    const incCents = nonTransfers
      .filter((t) => t.direction === 'INCOME')
      .reduce((acc, t) => acc + toCents(t.amount), 0);
    const expCents = nonTransfers
      .filter((t) => t.direction === 'EXPENSE')
      .reduce((acc, t) => acc + toCents(t.amount), 0);
    const netCents = incCents - expCents;
    const rate = incCents > 0 ? ((netCents / incCents) * 100).toFixed(1) : '0.0';
    return {
      totalIncome: fromCents(incCents),
      totalExpense: fromCents(expCents),
      netResult: fromCents(netCents),
      preservationRate: rate,
    };
  }, [periodTransactions]);

  const scopedBoletos = useMemo(() => {
    return boletos.filter((b) => (scope === 'CONSOLIDATED' ? true : b.entityId === scope));
  }, [boletos, scope]);

  const pendingBoletos = useMemo(() => {
    return scopedBoletos
      .filter((b) => b.status === 'PENDING')
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [scopedBoletos]);

  const totalPendingBoletos = useMemo(() => {
    return fromCents(pendingBoletos.reduce((acc, b) => acc + toCents(b.valorOriginal), 0));
  }, [pendingBoletos]);

  // Real monthly chart data aggregated from scopedTransactions
  const monthlySeries = useMemo(() => {
    const targetYear = period && period !== 'ALL' ? period.slice(0, 4) : '2026';
    const byMonth = new Map<string, { incomeCents: number; expenseCents: number }>();

    scopedTransactions.forEach((t) => {
      if (t.isInternalTransfer || !t.date.startsWith(targetYear)) return;
      const ym = t.date.slice(0, 7);
      const curr = byMonth.get(ym) || { incomeCents: 0, expenseCents: 0 };
      if (t.direction === 'INCOME') curr.incomeCents += toCents(t.amount);
      else curr.expenseCents += toCents(t.amount);
      byMonth.set(ym, curr);
    });

    const sortedKeys = Array.from(byMonth.keys()).sort();
    const maxCents = sortedKeys.reduce((max, k) => {
      const item = byMonth.get(k)!;
      return Math.max(max, item.incomeCents, item.expenseCents);
    }, 0);

    return sortedKeys.map((ym) => {
      const mIdx = Number(ym.slice(5, 7)) - 1;
      const item = byMonth.get(ym)!;
      return {
        ym,
        label: `${MONTH_NAMES[mIdx] || ym.slice(5, 7)}/${ym.slice(2, 4)}`,
        income: fromCents(item.incomeCents),
        expense: fromCents(item.expenseCents),
        incPct: maxCents > 0 ? Math.max(8, Math.round((item.incomeCents / maxCents) * 100)) : 0,
        expPct: maxCents > 0 ? Math.max(8, Math.round((item.expenseCents / maxCents) * 100)) : 0,
      };
    });
  }, [scopedTransactions, period]);

  // Real income breakdown by category for the selected period
  const incomeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let totalCents = 0;

    periodTransactions
      .filter((t) => t.direction === 'INCOME' && !t.isInternalTransfer)
      .forEach((t) => {
        const c = toCents(t.amount);
        totalCents += c;
        map.set(t.category, (map.get(t.category) || 0) + c);
      });

    return Array.from(map.entries())
      .map(([category, cents]) => ({
        category,
        amount: fromCents(cents),
        percent: totalCents > 0 ? Math.round((cents / totalCents) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [periodTransactions]);

  const scopedCards = useMemo(() => {
    return cards.filter((c) => (scope === 'CONSOLIDATED' ? true : c.entityId === scope));
  }, [cards, scope]);

  const sortedRecent = useMemo(() => {
    return [...periodTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }, [periodTransactions]);

  const scopeLabel =
    scope === 'CONSOLIDATED' ? 'Saldo consolidado' : scope === 'CPF' ? 'Saldo pessoal (CPF)' : 'Saldo empresa (CNPJ)';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header row (Desktop actions) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#14263d] dark:text-white">
            Visão executiva
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Escopo: <strong className="text-slate-800 dark:text-slate-200">{scope}</strong> · Competência:{' '}
            <strong className="text-slate-800 dark:text-slate-200">{period === 'ALL' ? 'Todo período' : period}</strong>
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('documents')}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 min-h-11 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Camera size={16} />
            Scanner & Documentos
          </button>
          <button
            type="button"
            onClick={onOpenNew}
            className="bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 min-h-11 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Novo lançamento
          </button>
        </div>
      </div>

      {/* 1. SALDO CONSOLIDADO (HERO CARD) */}
      <section className="bg-gradient-to-br from-[#14263d] to-[#1d3552] dark:from-slate-900 dark:to-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={15} />
              {scopeLabel}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1.5 tracking-tight">
              R$ {formatCurrencyBRL(totalBalance)}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Derivado do saldo inicial + lançamentos confirmados em {scopedAccounts.length} conta
              {scopedAccounts.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="px-4 min-h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
            >
              Ver contas ({scopedAccounts.length})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="md:hidden px-4 min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Camera size={15} /> Scanner
            </button>
          </div>
        </div>
      </section>

      {/* 2. RECEITAS & DESPESAS SIDE BY SIDE + RESULTADO + A VENCER */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Receitas</span>
          <div className="text-lg sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 my-1.5">
            R$ {formatCurrencyBRL(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>No período</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Despesas</span>
          <div className="text-lg sm:text-2xl font-extrabold text-red-700 dark:text-red-400 my-1.5">
            R$ {formatCurrencyBRL(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>No período</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resultado</span>
          <div
            className={`text-lg sm:text-2xl font-extrabold my-1.5 ${
              netResult >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            R$ {formatCurrencyBRL(netResult)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {preservationRate}% preservado
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">A vencer (Boletos)</span>
          <div className="text-lg sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400 my-1.5">
            R$ {formatCurrencyBRL(totalPendingBoletos)}
          </div>
          <div className="text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{pendingBoletos.length} pendente{pendingBoletos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* 3. CENTRAL DE VENCIMENTOS */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm sm:text-base font-bold text-[#14263d] dark:text-white">
              Central de Vencimentos & Contadores
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('boletos')}
            className="px-3.5 min-h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Gerenciar boletos →
          </button>
        </div>

        {pendingBoletos.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 py-2">
            Nenhum boleto ou obrigação pendente para o escopo selecionado.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pendingBoletos.slice(0, 3).map((bol) => {
              const countdown = calculateCountdown(bol.vencimento, false);
              return (
                <div
                  key={bol.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#14263d] dark:text-white truncate">
                        {bol.beneficiario}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                        {bol.entityId}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      R$ {formatCurrencyBRL(bol.valorOriginal)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${countdown.badgeColor}`}>
                      {countdown.shortLabel}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {bol.vencimento.split('-').reverse().join('/')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. MOVIMENTAÇÕES RECENTES (Cards no mobile, Tabela no desktop) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-bold text-[#14263d] dark:text-white">
            Últimas movimentações
          </h3>
          <button
            type="button"
            onClick={() => onNavigate(scope === 'CNPJ' ? 'cnpj' : 'cpf')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer min-h-10 px-2"
          >
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {sortedRecent.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            Nenhuma movimentação encontrada para este período e escopo.
          </p>
        ) : (
          <>
            {/* Mobile Vertical Cards */}
            <div className="md:hidden space-y-2.5">
              {sortedRecent.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onEditTransaction && onEditTransaction(t)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.description}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{t.date.split('-').reverse().join('/')}</span>
                      <span>·</span>
                      <span>{t.category}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.entityId === 'CPF'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {t.entityId}
                      </span>
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
                </button>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Data</th>
                    <th className="pb-3 font-semibold">Descrição</th>
                    <th className="pb-3 font-semibold">Categoria</th>
                    <th className="pb-3 font-semibold">Conta</th>
                    <th className="pb-3 font-semibold">Vínculo</th>
                    <th className="pb-3 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedRecent.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onEditTransaction && onEditTransaction(t)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {t.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-100">
                        {t.description}
                        {t.isInternalTransfer && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Transferência
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-medium">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{t.account}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.entityId === 'CPF'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {t.entityId}
                        </span>
                      </td>
                      <td
                        className={`py-3 text-right font-bold ${
                          t.direction === 'INCOME'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {t.direction === 'INCOME' ? '+ ' : '− '}
                        R$ {formatCurrencyBRL(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* 5. REAL CHARTS & CARDS SUMMARY */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Flow derived from actual transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-[#14263d] dark:text-white">Fluxo financeiro mensal</h3>
              <p className="text-xs text-slate-400">Receitas vs Despesas reais por competência</p>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg font-medium">
              {period === 'ALL' ? 'Histórico' : period.slice(0, 4)}
            </span>
          </div>

          {monthlySeries.length === 0 ? (
            <div className="h-40 grid place-items-center text-xs text-slate-400">
              Sem lançamentos no ano selecionado para exibir o gráfico.
            </div>
          ) : (
            <div className="h-48 flex items-end gap-4 px-2 pt-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              {monthlySeries.map((m) => (
                <div key={m.ym} className="flex-1 h-full flex flex-col justify-end items-center gap-2 min-w-0">
                  <div className="w-full flex justify-center items-end gap-1.5 h-36">
                    <div
                      style={{ height: `${m.incPct}%` }}
                      className="w-4 sm:w-6 bg-[#14263d] dark:bg-blue-500 rounded-t-sm transition-all"
                      title={`Receitas: R$ ${formatCurrencyBRL(m.income)}`}
                    />
                    <div
                      style={{ height: `${m.expPct}%` }}
                      className="w-4 sm:w-6 bg-emerald-500 rounded-t-sm transition-all"
                      title={`Despesas: R$ ${formatCurrencyBRL(m.expense)}`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{m.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 mt-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#14263d] dark:bg-blue-500" /> Receitas
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Despesas
            </div>
          </div>
        </div>

        {/* Income Breakdown & Card Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between gap-5">
          <div>
            <h3 className="text-sm font-bold text-[#14263d] dark:text-white mb-1">
              Origem das receitas ({period === 'ALL' ? 'Geral' : period})
            </h3>
            <p className="text-xs text-slate-400 mb-4">Distribuição calculada sobre lançamentos reais</p>

            {incomeBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Nenhuma receita registrada no período.</p>
            ) : (
              <div className="space-y-3">
                {incomeBreakdown.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs font-semibold mb-1 gap-2">
                      <span className="text-slate-600 dark:text-slate-300 truncate">{item.category}</span>
                      <span className="text-[#14263d] dark:text-white shrink-0">
                        {item.percent}% (R$ {formatCurrencyBRL(item.amount)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#14263d] dark:text-white">
              <span className="flex items-center gap-1.5">
                <CreditCardIcon size={14} className="text-amber-500" /> Faturas em aberto
              </span>
              <button
                type="button"
                onClick={() => onNavigate('cards')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Cartões
              </button>
            </div>
            {scopedCards.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum cartão cadastrado neste escopo.</p>
            ) : (
              scopedCards.slice(0, 2).map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl"
                >
                  <span className="text-slate-700 dark:text-slate-200 truncate">
                    {c.cardName} (dia {c.dueDay})
                  </span>
                  <span className="font-bold text-red-700 dark:text-red-400 shrink-0">
                    R$ {formatCurrencyBRL(c.currentInvoiceAmount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
