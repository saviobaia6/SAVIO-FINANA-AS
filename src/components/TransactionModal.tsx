import React, { useState, useEffect } from 'react';
import {
  Transaction,
  Account,
  APP_CATEGORIES,
  OPERATION_TYPES,
  OPERATION_TYPE_LABELS,
  OperationType,
} from '../types';
import { parseCurrencyInput } from '../utils/financeCalculations';
import { X, Check, AlertCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>, editId?: string) => void;
  accounts: Account[];
  defaultEntity?: 'CPF' | 'CNPJ';
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  defaultEntity = 'CPF',
  editingTransaction = null,
}) => {
  const [direction, setDirection] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [entityId, setEntityId] = useState<'CPF' | 'CNPJ'>(defaultEntity);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Alimentação');
  const [operationType, setOperationType] = useState<OperationType>('PIX');
  const [counterparty, setCounterparty] = useState('');
  const [externalId, setExternalId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>('');
  const [isInternalTransfer, setIsInternalTransfer] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingTransaction) {
      setDirection(editingTransaction.direction);
      setEntityId(editingTransaction.entityId);
      setDescription(editingTransaction.description);
      setCategory(
        (APP_CATEGORIES as readonly string[]).includes(editingTransaction.category)
          ? editingTransaction.category
          : 'Outros'
      );
      setOperationType(editingTransaction.operationType || 'OUTRO');
      setCounterparty(editingTransaction.counterparty || '');
      setExternalId(editingTransaction.externalId || '');
      setAmount(editingTransaction.amount.toFixed(2).replace('.', ','));
      setDate(editingTransaction.date);
      setAccountId(editingTransaction.accountId);
      setIsInternalTransfer(Boolean(editingTransaction.isInternalTransfer));
    } else {
      setDirection('EXPENSE');
      setEntityId(defaultEntity);
      setDescription('');
      setCategory(defaultEntity === 'CNPJ' ? 'Serviço MEI' : 'Alimentação');
      setOperationType('PIX');
      setCounterparty('');
      setExternalId('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsInternalTransfer(false);
      const preferredAccount = accounts.find((a) => a.entityId === defaultEntity) || accounts[0];
      setAccountId(preferredAccount?.id || '');
    }
  }, [isOpen, defaultEntity, editingTransaction, accounts]);

  if (!isOpen) return null;

  const selectedAccountObj = accounts.find((a) => a.id === accountId) || accounts[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseCurrencyInput(amount);
    if (!description.trim()) {
      setErrorMsg('Informe uma descrição para o lançamento.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor maior que zero (ex.: 150,00).');
      return;
    }
    if (!selectedAccountObj) {
      setErrorMsg('Cadastre ou selecione uma conta bancária válida.');
      return;
    }

    onSave(
      {
        entityId,
        accountId: selectedAccountObj.id,
        date,
        description: description.trim(),
        category,
        account: `${selectedAccountObj.institutionName} · ${selectedAccountObj.accountName}`,
        amount: parsedAmount,
        direction,
        status: editingTransaction?.status || 'CONFIRMED',
        origin: editingTransaction?.origin || 'MANUAL',
        isInternalTransfer: isInternalTransfer || operationType === 'TRANSFERENCIA_PROPRIA',
        operationType,
        counterparty: counterparty.trim() || undefined,
        externalId: externalId.trim() || undefined,
      },
      editingTransaction?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end md:items-center justify-center">
      <div
        className="bg-white dark:bg-slate-900 w-full md:max-w-lg rounded-t-3xl md:rounded-2xl max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-title"
      >
        <header className="shrink-0 bg-[#14263d] text-white p-5 flex justify-between items-center">
          <h2 id="transaction-title" className="text-lg font-bold">
            {editingTransaction ? 'Editar lançamento' : 'Novo lançamento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-11 min-h-11 grid place-items-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar formulário"
          >
            <X size={22} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Natureza
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('INCOME')}
                  className={`min-h-12 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                    direction === 'INCOME'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Receita (+)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('EXPENSE')}
                  className={`min-h-12 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                    direction === 'EXPENSE'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Despesa (−)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tx-entity" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Vínculo (Titularidade)
                </label>
                <select
                  id="tx-entity"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value as 'CPF' | 'CNPJ')}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
                >
                  <option value="CPF">CPF (Pessoal)</option>
                  <option value="CNPJ">CNPJ (MEI / Empresa)</option>
                </select>
              </div>

              <div>
                <label htmlFor="tx-optype" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Tipo de operação
                </label>
                <select
                  id="tx-optype"
                  value={operationType}
                  onChange={(e) => {
                    const op = e.target.value as OperationType;
                    setOperationType(op);
                    if (op === 'TRANSFERENCIA_PROPRIA') setIsInternalTransfer(true);
                  }}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
                >
                  {OPERATION_TYPES.map((op) => (
                    <option key={op} value={op}>
                      {OPERATION_TYPE_LABELS[op]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="tx-desc" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Descrição
              </label>
              <input
                id="tx-desc"
                type="text"
                required
                placeholder="Ex.: Remuneração, Mercado, Venda..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tx-cat" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Categoria
                </label>
                <select
                  id="tx-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
                >
                  {APP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Valor (R$)
                </label>
                <input
                  id="tx-amount"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 font-bold min-h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tx-date" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Data
                </label>
                <input
                  id="tx-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
                />
              </div>

              <div>
                <label htmlFor="tx-account" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Conta vinculada
                </label>
                <select
                  id="tx-account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.institutionName} ({acc.entityId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tx-counterparty" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Pagador / Recebedor (opcional)
                </label>
                <input
                  id="tx-counterparty"
                  type="text"
                  placeholder="Ex.: Supermercado Central"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
                />
              </div>

              <div>
                <label htmlFor="tx-external-id" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  ID / E2E Pix (opcional)
                </label>
                <input
                  id="tx-external-id"
                  type="text"
                  placeholder="Ex.: E000000002026..."
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500 min-h-12"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternalTransfer}
                onChange={(e) => setIsInternalTransfer(e.target.checked)}
                className="w-5 h-5 min-h-5 accent-emerald-600"
              />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                Transferência entre contas próprias (não somar como receita/despesa)
              </span>
            </label>
          </div>

          <footer className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-[calc(16px+env(safe-area-inset-bottom))] flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-12 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[1.5] min-h-12 bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              {editingTransaction ? 'Atualizar' : 'Salvar lançamento'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
