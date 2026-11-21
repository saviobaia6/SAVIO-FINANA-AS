import React from 'react';
import { Transaction } from '../types';
import { Building2, Plus, FileText, CheckCircle2 } from 'lucide-react';

interface CnpjViewProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
}

export const CnpjView: React.FC<CnpjViewProps> = ({ transactions, onAddTransaction }) => {
  const cnpjTrs = transactions.filter(t => t.entityId === 'CNPJ');
  const totalCnpjIncome = cnpjTrs.filter(t => t.direction === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const totalCnpjExpense = cnpjTrs.filter(t => t.direction === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
  const operationalResult = totalCnpjIncome - totalCnpjExpense;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">EMPRESA · MEI</span>
            <h2 className="text-2xl font-extrabold text-[#14263d]">Empresa · CNPJ</h2>
          </div>
          <p className="text-xs text-slate-500">
            Controle separado das movimentações empresariais. A conta PJ deve permanecer isolada da pessoa física.
          </p>
        </div>
        <button
          onClick={onAddTransaction}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar receita / despesa CNPJ
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
        <span className="font-bold">⚠️ Regra de Separação:</span> Transferências do titular para a empresa não serão classificadas automaticamente como faturamento.
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Receita de serviços (CNPJ)</span>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            R$ {totalCnpjIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <small className="text-[11px] text-slate-400 mt-1 block">Faturamento do período</small>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Despesas empresariais</span>
          <div className="text-2xl font-bold text-red-700 mt-2">
            R$ {totalCnpjExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <small className="text-[11px] text-slate-400 mt-1 block">Custos e insumos</small>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Resultado operacional</span>
          <div className="text-2xl font-bold text-[#14263d] mt-2">
            R$ {operationalResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <small className="text-[11px] text-slate-400 mt-1 block">Antes de retiradas e tributos</small>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">DAS / Obrigações</span>
          <div className="text-2xl font-bold text-amber-700 mt-2">R$ 75,90</div>
          <small className="text-[11px] text-amber-800 mt-1 block">Vencimento em 20/11</small>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#14263d]">Receitas e serviços cadastrados</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">CNPJ</span>
          </div>
          <ul className="divide-y divide-slate-100 text-xs">
            <li className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Copos personalizados</p>
                <small className="text-slate-400">Venda / produto personalizado</small>
              </div>
              <span className="font-bold text-emerald-700">R$ 1.500,00</span>
            </li>
            <li className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Impressão e serviços gráficos</p>
                <small className="text-slate-400">Serviço prestado</small>
              </div>
              <span className="font-bold text-emerald-700">R$ 950,00</span>
            </li>
            <li className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Produtos Boticário (Revenda)</p>
                <small className="text-slate-400">Comissão / Vendas</small>
              </div>
              <span className="font-bold text-emerald-700">R$ 1.400,00</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#14263d]">Rotina empresarial</h3>
            <span className="text-xs text-slate-400">Obrigações</span>
          </div>
          <ul className="divide-y divide-slate-100 text-xs">
            <li className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Notas Fiscais (NFS-e)</p>
                <small className="text-slate-400">Emitidas e recebidas no mês</small>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px]">3 Emitidas</span>
            </li>
            <li className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Guia DAS MEI</p>
                <small className="text-slate-400">Simples Nacional · Leitor de Boletos</small>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md font-bold text-[10px]">Aguardando pagamento</span>
            </li>
            <li className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Conciliação Bancária PJ</p>
                <small className="text-slate-400">Nubank Empresa</small>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">Sincronizado</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Movimentações empresariais</h3>
          <span className="text-xs text-slate-400">{cnpjTrs.length} registros</span>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cnpjTrs.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-6 text-slate-500">{t.date.split('-').reverse().join('/')}</td>
                  <td className="py-3.5 px-6 font-medium text-slate-800">{t.description}</td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
