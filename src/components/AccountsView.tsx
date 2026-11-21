import React from 'react';
import { Account } from '../types';
import { Wallet, Plus, Building2, CheckCircle2 } from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  onAddAccount?: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts }) => {
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Contas e cartões bancários</h2>
          <p className="text-xs text-slate-500">
            Instituições, saldos e meios de pagamento sincronizados. Os nomes representam fontes distintas para organização.
          </p>
        </div>
        <button
          onClick={() => alert('O cadastro de novas contas será aberto na próxima etapa.')}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ＋ Nova conta
        </button>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400">Saldo Consolidado em Contas</span>
          <div className="text-3xl font-extrabold text-[#14263d] mt-1">
            R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
          <Wallet className="w-8 h-8" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Instituições e meios de pagamento</h3>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">Cadastro de referência</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="py-3 px-6 font-semibold">Instituição / Conta</th>
                <th className="py-3 px-6 font-semibold">Tipo</th>
                <th className="py-3 px-6 font-semibold">Vínculo</th>
                <th className="py-3 px-6 font-semibold">Status de Conexão</th>
                <th className="py-3 px-6 font-semibold text-right">Saldo Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800">{acc.institutionName}</div>
                    <small className="text-slate-400">{acc.accountName}</small>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium capitalize">
                      {acc.accountType}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      acc.entityId === 'CPF' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {acc.entityId}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pronto para Open Finance
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-extrabold text-[#14263d]">
                    R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
