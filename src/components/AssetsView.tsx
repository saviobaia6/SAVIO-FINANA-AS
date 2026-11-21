import React from 'react';
import { Asset } from '../types';
import { TrendingUp, Plus, Shield } from 'lucide-react';

interface AssetsViewProps {
  assets: Asset[];
}

export const AssetsView: React.FC<AssetsViewProps> = ({ assets }) => {
  const totalAssets = assets.reduce((acc, a) => acc + a.currentValue, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Patrimônio e Investimentos</h2>
          <p className="text-xs text-slate-500">
            Reservas, aplicações financeiras, produtos Boticário e evolução patrimonial.
          </p>
        </div>
        <button
          onClick={() => alert('Cadastro de novo ativo será habilitado na próxima versão.')}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo ativo
        </button>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400">Patrimônio Líquido Consolidado</span>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1">
            R$ {totalAssets.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Ativos cadastrados</h3>
          <span className="text-xs text-slate-400">{assets.length} ativos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="py-3 px-6 font-semibold">Descrição / Ativo</th>
                <th className="py-3 px-6 font-semibold">Tipo</th>
                <th className="py-3 px-6 font-semibold">Instituição</th>
                <th className="py-3 px-6 font-semibold">Vínculo</th>
                <th className="py-3 px-6 font-semibold text-right">Valor Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{a.description}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                      {a.assetType}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{a.institutionName}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.entityId === 'CPF' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {a.entityId}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-extrabold text-emerald-700">
                    R$ {a.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
