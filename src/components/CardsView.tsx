import React, { useState } from 'react';
import { CreditCard as CreditCardType, Account } from '../types';
import { parseCurrencyInput, formatCurrencyBRL } from '../utils/financeCalculations';
import { CreditCard, Plus, X, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface CardsViewProps {
  cards: CreditCardType[];
  accounts: Account[];
  onAddCard: (card: Omit<CreditCardType, 'id'>) => void;
  onPayCardInvoice: (cardId: string, accountId?: string) => void;
  onDeleteCard: (id: string) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  cards,
  accounts,
  onAddCard,
  onPayCardInvoice,
  onDeleteCard,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalCard, setPayModalCard] = useState<CreditCardType | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState('');

  const [cardName, setCardName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [last4, setLast4] = useState('');
  const [entityId, setEntityId] = useState<'CPF' | 'CNPJ'>('CPF');
  const [limitStr, setLimitStr] = useState('');
  const [invoiceStr, setInvoiceStr] = useState('0,00');
  const [closingDay, setClosingDay] = useState('10');
  const [dueDay, setDueDay] = useState('17');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedLimit = parseCurrencyInput(limitStr);
    const parsedInvoice = parseCurrencyInput(invoiceStr || '0');
    const cleanLast4 = last4.replace(/\D/g, '').slice(0, 4);
    const cDay = Number(closingDay);
    const dDay = Number(dueDay);

    if (!cardName.trim() || !institutionName.trim()) {
      setErrorMsg('Informe o nome e a instituição do cartão.');
      return;
    }
    if (cleanLast4.length !== 4) {
      setErrorMsg('Informe exatamente os 4 últimos dígitos do cartão (nunca o número completo).');
      return;
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setErrorMsg('Informe um limite válido maior que zero.');
      return;
    }
    if (cDay < 1 || cDay > 31 || dDay < 1 || dDay > 31) {
      setErrorMsg('Dias de fechamento e vencimento devem estar entre 1 e 31.');
      return;
    }

    onAddCard({
      entityId,
      institutionName: institutionName.trim(),
      cardName: cardName.trim(),
      last4: cleanLast4,
      limit: parsedLimit,
      closingDay: cDay,
      dueDay: dDay,
      currentInvoiceAmount: isNaN(parsedInvoice) ? 0 : parsedInvoice,
      status: parsedInvoice > 0 ? 'OPEN' : 'PAID',
    });

    setCardName('');
    setInstitutionName('');
    setLast4('');
    setLimitStr('');
    setInvoiceStr('0,00');
    setModalOpen(false);
  };

  const openPayModal = (card: CreditCardType) => {
    const preferred = accounts.find((a) => a.entityId === card.entityId) || accounts[0];
    setPaymentAccountId(preferred?.id || '');
    setPayModalCard(card);
  };

  const confirmPayInvoice = () => {
    if (!payModalCard) return;
    onPayCardInvoice(payModalCard.id, paymentAccountId || undefined);
    setPayModalCard(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
            Cartões de Crédito
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Faturas em aberto, limite utilizado/disponível e datas de fechamento. Armazenamos apenas os 4 últimos dígitos.
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
          Novo cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => {
          const available = Math.max(0, card.limit - card.currentInvoiceAmount);
          const usagePct = card.limit > 0 ? Math.min(100, Math.round((card.currentInvoiceAmount / card.limit) * 100)) : 0;

          return (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[#14263d] dark:text-emerald-400">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        card.entityId === 'CPF'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {card.entityId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remover o cartão "${card.cardName}"?`)) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                      aria-label={`Remover ${card.cardName}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#14263d] dark:text-white">{card.cardName}</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Final ···· {card.last4} ({card.institutionName})
                </p>

                <div className="space-y-2 text-xs py-3 border-y border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Limite total:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      R$ {formatCurrencyBRL(card.limit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Disponível:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      R$ {formatCurrencyBRL(available)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${usagePct > 80 ? 'bg-red-500' : 'bg-emerald-600'}`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Fechamento / Vencimento:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Dia {card.closingDay} / Dia {card.dueDay}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <small className="text-[11px] text-slate-400 block">
                    {card.status === 'PAID' ? 'Fatura quitada' : 'Fatura atual em aberto'}
                  </small>
                  <span
                    className={`text-base font-extrabold ${
                      card.currentInvoiceAmount > 0
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    R$ {formatCurrencyBRL(card.currentInvoiceAmount)}
                  </span>
                </div>
                {card.currentInvoiceAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => openPayModal(card)}
                    className="px-3.5 min-h-10 bg-[#14263d] dark:bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-[#1d3552] dark:hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Pagar Fatura
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Card Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end md:items-center justify-center">
          <div
            className="bg-white dark:bg-slate-900 w-full md:max-w-md rounded-t-3xl md:rounded-2xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
          >
            <header className="bg-[#14263d] text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Novo cartão (apenas 4 últimos dígitos)</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-10 min-h-10 grid place-items-center text-slate-300 hover:text-white cursor-pointer"
                aria-label="Fechar"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nome do cartão (ex.: Inter Black)"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                />
                <input
                  type="text"
                  required
                  placeholder="Instituição (ex.: Banco Inter)"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    4 últimos dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    placeholder="Ex.: 4821"
                    value={last4}
                    onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Vínculo
                  </label>
                  <select
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value as 'CPF' | 'CNPJ')}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Limite total (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="8000,00"
                    value={limitStr}
                    onChange={(e) => setLimitStr(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Fatura atual (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={invoiceStr}
                    onChange={(e) => setInvoiceStr(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Dia fechamento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Dia vencimento
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
                  />
                </div>
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
                  <CheckCircle2 size={16} /> Salvar cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Invoice Modal */}
      {payModalCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end md:items-center justify-center">
          <div
            className="bg-white dark:bg-slate-900 w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#14263d] dark:text-white">
                Pagar fatura · {payModalCard.cardName}
              </h3>
              <button
                type="button"
                onClick={() => setPayModalCard(null)}
                className="min-w-10 min-h-10 grid place-items-center text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">
              Valor da fatura:{' '}
              <strong className="text-red-700 dark:text-red-400">
                R$ {formatCurrencyBRL(payModalCard.currentInvoiceAmount)}
              </strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Debitar pagamento da conta:
              </label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-12"
              >
                <option value="">Apenas zerar fatura</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.institutionName} · {a.accountName} ({a.entityId})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayModalCard(null)}
                className="flex-1 min-h-12 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPayInvoice}
                className="flex-[1.5] min-h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                Confirmar pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
