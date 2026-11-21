import React, { useState } from 'react';
import { Debt } from '../types';
import { toCents, fromCents, parseCurrencyInput, formatCurrencyBRL } from '../utils/financeCalculations';
import { Plus, ShieldAlert, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DebtsViewProps {
  debts: Debt[];
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onDeleteDebt: (id: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({ debts, onAddDebt, onDeleteDebt }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [creditorName, setCreditorName] = useState('');
  const [description, setDescription] = useState('');
  const [entityId, setEntityId] = useState<'CPF' | 'CNPJ'>('CPF');
  const [originalStr, setOriginalStr] = useState('');
  const [outstandingStr, setOutstandingStr] = useState('');
  const [installmentStr, setInstallmentStr] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [errorMsg, setErrorMsg] = useState('');

  const totalDebt = fromCents(debts.reduce((acc, d) => acc + toCents(d.outstandingAmount), 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const orig = parseCurrencyInput(originalStr);
    const out = parseCurrencyInput(outstandingStr || originalStr);
    const inst = installmentStr.trim() ? parseCurrencyInput(installmentStr) : undefined;
    const dDay = Number(dueDay);

    if (!creditorName.trim() || !description.trim()) {
      setErrorMsg('Informe o credor e a descrição da dívida.');
      return;
    }
    if (isNaN(orig) || orig <= 0 || isNaN(out) || out < 0) {
      setErrorMsg('Informe valores válidos.');
      return;
    }
    if (dDay < 1 || dDay > 31) {
      setErrorMsg('O dia de vencimento deve ser entre 1 e 31.');
      return;
    }

    onAddDebt({
      entityId,
      creditorName: creditorName.trim(),
      description: description.trim(),
      originalAmount: orig,
      outstandingAmount: out,
      installmentAmount: inst && !isNaN(inst) ? inst : undefined,
      dueDay: dDay,
      status: out === 0 ? 'PAID' : 'ACTIVE',
    });

    setCreditorName('');
    setDescription('');
    setOriginalStr('');
    setOutstandingStr('');
    setInstallmentStr('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
            Dívidas e Compromissos Futuros
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de financiamentos, empréstimos e parcelamentos de longo prazo.
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
          Registrar dívida
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400">Saldo Devedor Total</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-700 dark:text-red-400 mt-1">
            R$ {formatCurrencyBRL(totalDebt)}
          </div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded-2xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white">Compromissos ativos</h3>
          <span className="text-xs text-slate-400">{debts.length} registros</span>
        </div>

        {debts.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma dívida cadastrada.
          </p>
        ) : (
          <>
            {/* Mobile Vertical Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {debts.map((d) => (
                <div key={d.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {d.creditorName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{d.description}</div>
                    </div>
                    <div className="text-sm font-extrabold text-red-700 dark:text-red-400">
                      R$ {formatCurrencyBRL(d.outstandingAmount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Parcela:{' '}
                      {d.installmentAmount ? `R$ ${formatCurrencyBRL(d.installmentAmount)}` : '—'} · Dia{' '}
                      {d.dueDay}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remover "${d.creditorName}"?`)) onDeleteDebt(d.id);
                      }}
                      className="min-w-10 min-h-10 grid place-items-center text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-6 font-semibold">Credor / Descrição</th>
                    <th className="py-3 px-6 font-semibold">Vínculo</th>
                    <th className="py-3 px-6 font-semibold text-right">Valor Original</th>
                    <th className="py-3 px-6 font-semibold text-right">Saldo Devedor</th>
                    <th className="py-3 px-6 font-semibold text-right">Parcela Mensal</th>
                    <th className="py-3 px-6 font-semibold text-center">Vencimento</th>
                    <th className="py-3 px-6 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {debts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 dark:text-white">{d.creditorName}</div>
                        <small className="text-slate-400">{d.description}</small>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                          {d.entityId}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-slate-600 dark:text-slate-300">
                        R$ {formatCurrencyBRL(d.originalAmount)}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-red-700 dark:text-red-400">
                        R$ {formatCurrencyBRL(d.outstandingAmount)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-800 dark:text-slate-200">
                        {d.installmentAmount ? `R$ ${formatCurrencyBRL(d.installmentAmount)}` : '—'}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600 dark:text-slate-300 font-medium">
                        Dia {d.dueDay}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remover "${d.creditorName}"?`)) onDeleteDebt(d.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Debt Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end md:items-center justify-center">
          <div
            className="bg-white dark:bg-slate-900 w-full md:max-w-md rounded-t-3xl md:rounded-2xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
          >
            <header className="bg-[#14263d] text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Registrar dívida / financiamento</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-10 min-h-10 grid place-items-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <input
                type="text"
                required
                placeholder="Credor (ex.: Banco do Brasil, Financeira)"
                value={creditorName}
                onChange={(e) => setCreditorName(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
              />

              <input
                type="text"
                required
                placeholder="Descrição (ex.: Financiamento veículo)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Valor original (R$)"
                  value={originalStr}
                  onChange={(e) => setOriginalStr(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Saldo devedor (R$)"
                  value={outstandingStr}
                  onChange={(e) => setOutstandingStr(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Parcela (R$)"
                  value={installmentStr}
                  onChange={(e) => setInstallmentStr(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                />
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Dia"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                />
                <select
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value as 'CPF' | 'CNPJ')}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                </select>
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
                  <CheckCircle2 size={16} /> Salvar dívida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
