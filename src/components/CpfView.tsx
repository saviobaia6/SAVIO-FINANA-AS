import React, { useState } from 'react';
import { Transaction } from '../types';
import { Search, Plus, Trash2, User } from 'lucide-react';

interface CpfViewProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
}

export const CpfView: React.FC<CpfViewProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const cpfTrs = transactions.filter(t => t.entityId === 'CPF');
  const filtered = cpfTrs.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalCpfIncome = cpfTrs.filter(t => t.direction === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const totalCpfExpense = cpfTrs.filter(t => t.direction === 'EXPENSE').reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">PESSOAL</span>
            <h2 className="text-2xl font-extrabold text-[#14263d]">Finanças Pessoais · CPF</h2>
          </div>
          <p className="text-xs text-slate-500">
            Receitas, despesas e movimentações da pessoa física (Câmara Municipal, UNIP, UNIGRANDE, SENAR e despesas cotidianas).
          </p>
        </div>
        <button
          onClick={onAddTransaction}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo lançamento pessoal
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <span className="text-xs text-slate-400">Total Entradas CPF</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            R$ {totalCpfIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <span className="text-xs text-slate-400">Total Saídas CPF</span>
          <div className="text-xl font-bold text-red-700 mt-1">
            R$ {totalCpfExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <span className="text-xs text-slate-400">Saldo Líquido CPF</span>
          <div className="text-xl font-bold text-[#14263d] mt-1">
            R$ {(totalCpfIncome - totalCpfExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar movimentação pessoal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 bg-white outline-none focus:border-emerald-500"
        >
          <option value="ALL">Todas as categorias</option>
          <option value="Salário">Salário</option>
          <option value="Moradia">Moradia</option>
          <option value="Alimentação">Alimentação</option>
          <option value="Transporte">Transporte</option>
          <option value="Cartão">Cartão de Crédito</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Histórico de lançamentos CPF</h3>
          <span className="text-xs text-slate-400">{filtered.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="py-3 px-6 font-semibold">Data</th>
                <th className="py-3 px-6 font-semibold">Descrição</th>
                <th className="py-3 px-6 font-semibold">Categoria</th>
                <th className="py-3 px-6 font-semibold">Conta</th>
                <th className="py-3 px-6 font-semibold text-right">Valor</th>
                <th className="py-3 px-6 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500">{t.date.split('-').reverse().join('/')}</td>
                    <td className="py-3.5 px-6 font-medium text-slate-800">{t.description}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{t.account}</td>
                    <td className={`py-3.5 px-6 text-right font-bold ${
                      t.direction === 'INCOME' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {t.direction === 'INCOME' ? '+ ' : '− '}
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
