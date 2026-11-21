import React, { useState } from 'react';
import { Transaction, Boleto, Account, Debt, ChatMessage } from '../types';
import { Bot, Send, User, Sparkles, HelpCircle } from 'lucide-react';

interface AiAssistantViewProps {
  transactions: Transaction[];
  boletos: Boleto[];
  accounts: Account[];
  debts: Debt[];
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  transactions,
  boletos,
  accounts,
  debts
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Olá! Sou a inteligência artificial do FINANCE IA. Analisei seus registros financeiros pessoais (CPF) e empresariais (CNPJ). Como posso ajudar na sua gestão hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    'Quanto gastei neste mês?',
    'Quais boletos estão próximos do vencimento?',
    'Quanto o MEI faturou até agora?',
    'Qual cartão possui a maior fatura em aberto?',
    'Quanto tenho de despesas no meu CPF?'
  ];

  const handleSend = async (questionText?: string) => {
    const query = questionText || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const financialState = {
        transactions,
        boletos,
        accounts,
        debts
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, financialState })
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'ai',
        text: data.reply || 'Não foi possível gerar uma resposta no momento.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'ai',
        text: 'Ocorreu um erro ao conectar com o serviço de inteligência artificial.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-140px)] flex flex-col">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">GEMINI 2.5</span>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Inteligência Artificial Financeira</h2>
        </div>
        <p className="text-xs text-slate-500">
          Faça perguntas sobre suas finanças, solicite análises de gastos e orientações fundamentadas nos seus dados reais.
        </p>
      </div>

      {/* Suggested Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Sugestões:</span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap shadow-xs transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-xs p-6 overflow-y-auto space-y-4">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl grid place-items-center text-xs font-bold shrink-0 ${
              m.sender === 'user' ? 'bg-[#14263d] text-white' : 'bg-emerald-600 text-white'
            }`}>
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
              m.sender === 'user'
                ? 'bg-[#14263d] text-white rounded-tr-xs'
                : 'bg-slate-100 text-slate-800 rounded-tl-xs'
            }`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              <span className={`block text-[10px] mt-2 ${m.sender === 'user' ? 'text-slate-300' : 'text-slate-400'}`}>
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white grid place-items-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-500 animate-pulse">
              Analisando dados financeiros e preparando resposta...
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-3">
        <input
          type="text"
          placeholder="Pergunte sobre receitas, despesas, boletos ou planejamento..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-4 py-2.5 text-xs outline-none bg-transparent text-slate-800"
        />
        <button
          onClick={() => handleSend()}
          className="bg-[#14263d] hover:bg-[#1d3552] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" /> Enviar
        </button>
      </div>
    </div>
  );
};
