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
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-6 py-4 bg-[#14263d] text-white flex items-center justify-between">
          <h3 className="text-base font-bold">Novo Lançamento Financeiro</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Natureza</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('INCOME')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
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
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
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
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 bg-white outline-none focus:border-emerald-500"
              >
                <option value="CPF">CPF (Pessoal)</option>
                <option value="CNPJ">CNPJ (MEI / Empresa)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex.: Remuneração, Mercado, Venda de Copos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 bg-white outline-none focus:border-emerald-500"
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
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Conta Bancária / Meio</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 bg-white outline-none focus:border-emerald-500"
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#14263d] hover:bg-[#1d3552] text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Salvar lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
