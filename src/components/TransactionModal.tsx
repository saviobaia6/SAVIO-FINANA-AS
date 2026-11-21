import React, { useState } from 'react';
import { Transaction } from '../types';
import { X, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  defaultEntity?: 'CPF' | 'CNPJ';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultEntity = 'CPF'
}) => {
  const [direction, setDirection] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [entityId, setEntityId] = useState<'CPF' | 'CNPJ'>(defaultEntity);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Salário');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('Banco Inter');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description || isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, informe uma descrição e um valor válido.');
      return;
    }

    onSave({
      entityId,
      date,
      description: description.trim(),
      category,
      account,
      amount: numAmount,
      direction,
      status: 'CONFIRMED',
      origin: 'MANUAL'
    });

    setDescription('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end md:items-center justify-center animate-fadeIn">
      <div
        className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-2xl max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl border border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-title"
      >
        <header className="shrink-0 bg-[#14263d] text-white p-5 flex justify-between items-center">
          <h3 id="transaction-title" className="text-base font-bold">Novo lançamento financeiro</h3>
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
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Natureza</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('INCOME')}
                  className={`min-h-12 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    direction === 'INCOME'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Receita (+)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('EXPENSE')}
                  className={`min-h-12 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    direction === 'EXPENSE'
                      ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Despesa (−)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vínculo (Titularidade)</label>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value as 'CPF' | 'CNPJ')}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white outline-none focus:border-emerald-500 min-h-[48px]"
              >
                <option value="CPF">CPF (Pessoal)</option>
                <option value="CNPJ">CNPJ (MEI / Empresa)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex.: Remuneração, Mercado, Venda..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 min-h-[48px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white outline-none focus:border-emerald-500 min-h-[48px]"
                >
                  <option value="Salário">Salário</option>
                  <option value="Serviço MEI">Serviço MEI</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Cartão">Cartão de Crédito</option>
                  <option value="Impostos / DAS">Impostos / DAS</option>
                  <option value="Insumos / Produção">Insumos / Produção</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 font-bold min-h-[48px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Conta Bancária / Meio</label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white outline-none focus:border-emerald-500 min-h-[48px]"
                >
                  <option value="Banco Inter">Banco Inter</option>
                  <option value="RecargaPay">RecargaPay</option>
                  <option value="Nubank Empresa">Nubank Empresa</option>
                  <option value="Banco do Brasil">Banco do Brasil</option>
                  <option value="Cartão Inter">Cartão Inter</option>
                  <option value="Dinheiro">Dinheiro Físico</option>
                </select>
              </div>
            </div>
          </div>

          <footer className="shrink-0 p-4 border-t border-slate-200 bg-white pb-[calc(16px+env(safe-area-inset-bottom))] flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-12 border border-slate-300 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[1.5] min-h-12 bg-[#14263d] hover:bg-[#1d3552] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              Salvar lançamento
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
