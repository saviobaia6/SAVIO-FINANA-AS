import React from 'react';
import { PieChart, ShieldCheck, Target } from 'lucide-react';

export const PlanningView: React.FC = () => {
  const referenceIncome = 12450.00;
  const needs = referenceIncome * 0.50;
  const wants = referenceIncome * 0.30;
  const savings = referenceIncome * 0.20;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-extrabold text-[#14263d]">Planejamento Financeiro · Regra 50/30/20</h2>
        <p className="text-xs text-slate-500">
          Orçamento, metas e comparação entre valores previstos e efetivamente realizados.
        </p>
      </div>

      {/* 50/30/20 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">NECESSIDADES · 50%</span>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#14263d] mb-1">
            R$ {needs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400">Moradia, alimentação, contas básicas e saúde.</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">DESEJOS · 30%</span>
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#14263d] mb-1">
            R$ {wants.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400">Lazer, compras pessoais e entretenimento.</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">RESERVA · 20%</span>
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#14263d] mb-1">
            R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400">Investimentos e fundo de emergência.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#14263d] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Regra essencial de cálculo
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          O sistema mantém separado o orçamento planejado dos valores efetivamente recebidos e pagos. A divisão 50/30/20 é calculada sobre a receita líquida recebida (R$ 12.450,00) e não se aplica automaticamente sobre empréstimos ou transferências internas entre contas próprias.
        </p>
      </div>
    </div>
  );
};
