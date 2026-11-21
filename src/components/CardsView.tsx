import React from 'react';
import { CreditCard as CreditCardType } from '../types';
import { CreditCard, Plus, Calendar, ShieldCheck } from 'lucide-react';

interface CardsViewProps {
  cards: CreditCardType[];
}

export const CardsView: React.FC<CardsViewProps> = ({ cards }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Controle de Cartões de Crédito</h2>
          <p className="text-xs text-slate-500">
            Faturas em aberto, limites, melhores dias de compra e controle de parcelamentos.
          </p>
        </div>
        <button
          onClick={() => alert('Cadastro de novo cartão será habilitado na próxima versão.')}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(card => (
          <div key={card.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 bg-slate-100 rounded-xl text-[#14263d]">
                  <CreditCard className="w-5 h-5" />
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  card.entityId === 'CPF' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {card.entityId}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#14263d]">{card.cardName}</h3>
              <p className="text-xs text-slate-400 mb-4">Final ···· {card.last4} ({card.institutionName})</p>

              <div className="space-y-2 text-xs py-3 border-y border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Limite total:</span>
                  <span className="font-bold text-slate-800">R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fechamento / Vencimento:</span>
                  <span className="font-semibold text-slate-700">Dia {card.closingDay} / Dia {card.dueDay}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <small className="text-[11px] text-slate-400 block">Fatura atual em aberto</small>
                <span className="text-base font-extrabold text-red-700">
                  R$ {card.currentInvoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={() => alert(`Fatura do cartão ${card.cardName} selecionada para pagamento.`)}
                className="px-3 py-1.5 bg-[#14263d] text-white rounded-xl text-xs font-semibold hover:bg-[#1d3552] transition-colors"
              >
                Ver Fatura
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
