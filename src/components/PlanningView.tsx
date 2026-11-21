import React, { useMemo } from 'react';
import { Transaction, EntityScope } from '../types';
import {
  filterTransactionsByPeriod,
  calculateBudget503020,
  toCents,
  fromCents,
  formatCurrencyBRL,
} from '../utils/financeCalculations';
import { ShieldCheck, Target } from 'lucide-react';

interface PlanningViewProps {
  transactions: Transaction[];
  scope: EntityScope;
  period: string;
}

const NEEDS_CATEGORIES = new Set(['Moradia', 'Alimentação', 'Transporte', 'Impostos / DAS', 'Insumos / Produção']);

export const PlanningView: React.FC<PlanningViewProps> = ({ transactions, scope, period }) => {
  const periodScopedTrs = useMemo(() => {
    const byScope = transactions.filter((t) => {
      if (t.status === 'CANCELLED') return false;
      if (scope === 'CPF') return t.entityId === 'CPF';
      if (scope === 'CNPJ') return t.entityId === 'CNPJ';
      return true;
    });
    return filterTransactionsByPeriod(byScope, period);
  }, [transactions, scope, period]);

  const budget = useMemo(() => calculateBudget503020(periodScopedTrs), [periodScopedTrs]);

  const actuals = useMemo(() => {
    const expenses = periodScopedTrs.filter((t) => t.direction === 'EXPENSE' && !t.isInternalTransfer);
    let needsCents = 0;
    let wantsCents = 0;

    expenses.forEach((t) => {
      if (NEEDS_CATEGORIES.has(t.category)) {
        needsCents += toCents(t.amount);
      } else {
        wantsCents += toCents(t.amount);
      }
    });

    const totalExpCents = needsCents + wantsCents;
    const savedCents = Math.max(0, toCents(budget.realIncome) - totalExpCents);

    return {
      actualNeeds: fromCents(needsCents),
      actualWants: fromCents(wantsCents),
      actualSavings: fromCents(savedCents),
    };
  }, [periodScopedTrs, budget.realIncome]);

  const pct = (actual: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
          Planejamento Financeiro · Regra 50/30/20
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Calculado sobre a receita real do período ({period === 'ALL' ? 'Todo período' : period}, escopo {scope}):{' '}
          <strong className="text-emerald-700 dark:text-emerald-400">
            R$ {formatCurrencyBRL(budget.realIncome)}
          </strong>
        </p>
      </div>

      {/* 50/30/20 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md">
              NECESSIDADES · 50%
            </span>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#14263d] dark:text-white">
            R$ {formatCurrencyBRL(budget.needs)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Realizado: <strong>R$ {formatCurrencyBRL(actuals.actualNeeds)}</strong> (
            {pct(actuals.actualNeeds, budget.needs)}%)
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                actuals.actualNeeds > budget.needs ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${pct(actuals.actualNeeds, budget.needs)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">Moradia, alimentação, transporte, tributos e insumos.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md">
              DESEJOS / OUTROS · 30%
            </span>
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#14263d] dark:text-white">
            R$ {formatCurrencyBRL(budget.wants)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Realizado: <strong>R$ {formatCurrencyBRL(actuals.actualWants)}</strong> (
            {pct(actuals.actualWants, budget.wants)}%)
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                actuals.actualWants > budget.wants ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${pct(actuals.actualWants, budget.wants)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">Cartão de crédito, lazer, compras pessoais e outros.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
              RESERVA / SOBRA · 20%
            </span>
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#14263d] dark:text-white">
            R$ {formatCurrencyBRL(budget.savings)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Preservado no período: <strong>R$ {formatCurrencyBRL(actuals.actualSavings)}</strong> (
            {pct(actuals.actualSavings, budget.savings)}%)
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${pct(actuals.actualSavings, budget.savings)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">Margem disponível para investimentos e reserva.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#14263d] dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Critério de cálculo real
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Os tetos 50/30/20 são calculados dinamicamente sobre a receita efetiva recebida na competência selecionada (excluindo lançamentos cancelados e transferências internas entre contas próprias).
        </p>
      </div>
    </div>
  );
};
