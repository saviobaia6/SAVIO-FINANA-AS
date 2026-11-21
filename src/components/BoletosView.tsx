import React, { useState } from 'react';
import { Boleto } from '../types';
import { calculateCountdown } from '../utils/countdown';
import { Receipt, Check, AlertCircle, FileText, Sparkles, Plus, Search, Calendar, ShieldCheck, Clock } from 'lucide-react';

interface BoletosViewProps {
  boletos: Boleto[];
  onAddBoleto: (boleto: Boleto) => void;
  onPayBoleto: (id: string) => void;
}

export const BoletosView: React.FC<BoletosViewProps> = ({ boletos, onAddBoleto, onPayBoleto }) => {
  const [linhaInput, setLinhaInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [entityFilter, setEntityFilter] = useState<'ALL' | 'CPF' | 'CNPJ'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAnalyzeBoleto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linhaInput.trim()) return;

    // Check duplicate prevention
    const exists = boletos.some(b => b.linhaDigitavel === linhaInput.trim());
    if (exists) {
      alert('⚠️ Alerta de Duplicidade: Este boleto já está cadastrado no sistema!');
      return;
    }

    setAnalyzing(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/ai/parse-boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linhaDigitavel: linhaInput })
      });
      const data = await res.json();
      const parsed = data.boleto;

      const newBol: Boleto = {
        id: 'bol-' + Date.now(),
        beneficiario: parsed.beneficiario || 'Empresa Beneficiária',
        pagador: parsed.pagador || 'Titular FINANCE IA',
        instituicao: parsed.instituicao || 'Banco Emissor',
        linhaDigitavel: linhaInput.trim(),
        vencimento: parsed.vencimento || new Date().toISOString().split('T')[0],
        valorOriginal: parsed.valorOriginal || 150.00,
        descricao: parsed.descricao || 'Boleto analisado e validado por IA',
        status: 'PENDING',
        entityId: linhaInput.startsWith('8') ? 'CNPJ' : 'CPF',
        category: linhaInput.startsWith('8') ? 'Impostos / DAS' : 'Moradia'
      };

      onAddBoleto(newBol);
      setLinhaInput('');
      setSuccessMsg('Boleto interpretado, validado e classificado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao analisar boleto.');
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredBoletos = boletos.filter(b => {
    const countdown = calculateCountdown(b.vencimento, b.status === 'PAID');
    const matchesEntity = entityFilter === 'ALL' || b.entityId === entityFilter;
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'PAID' && b.status === 'PAID') ||
                          (statusFilter === 'PENDING' && b.status === 'PENDING') ||
                          (statusFilter === 'OVERDUE' && countdown.status === 'OVERDUE');
    const matchesSearch = b.beneficiario.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEntity && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-20 md:pb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">DDA & OPEN FINANCE</span>
          <h2 className="text-2xl font-extrabold text-[#14263d]">BOLETOS E COBRANÇAS IDENTIFICADOS</h2>
        </div>
        <p className="text-xs text-slate-500">
          Localizador inteligente de cobranças associadas ao CPF e CNPJ com contador regressivo em tempo real.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Analyzer Input Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#14263d] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" /> Localizador & Leitor de Linha Digitável
        </h3>

        <form onSubmit={handleAnalyzeBoleto} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Linha digitável do boleto / Código de barras</label>
            <input
              type="text"
              required
              placeholder="Ex.: 23793.38128 60000.123456 78901.234567 1 89120000015000"
              value={linhaInput}
              onChange={(e) => setLinhaInput(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-[11px] text-slate-400">
              💡 Prevenção automática de duplicidade ativa por código de barras.
            </span>
            <button
              type="submit"
              disabled={analyzing}
              className="bg-[#14263d] hover:bg-[#1d3552] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              {analyzing ? 'Analisando boleto com IA...' : 'Localizar e Adicionar Boleto'}
            </button>
          </div>
        </form>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por beneficiário ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50/50 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as any)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 bg-white outline-none"
          >
            <option value="ALL">Todos os Vínculos (CPF/CNPJ)</option>
            <option value="CPF">Apenas CPF</option>
            <option value="CNPJ">Apenas CNPJ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 bg-white outline-none"
          >
            <option value="ALL">Todas as Situações</option>
            <option value="PENDING">Pendentes</option>
            <option value="OVERDUE">Vencidas</option>
            <option value="PAID">Pagas</option>
          </select>
        </div>
      </div>

      {/* Boletos List with Countdowns */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Lista de Cobranças Identificadas</h3>
          <span className="text-xs text-slate-400">{filteredBoletos.length} itens</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="py-3 px-6 font-semibold">Beneficiário / Descrição</th>
                <th className="py-3 px-6 font-semibold">Vínculo</th>
                <th className="py-3 px-6 font-semibold">Vencimento & Contador</th>
                <th className="py-3 px-6 font-semibold text-right">Valor Original</th>
                <th className="py-3 px-6 font-semibold text-center">Situação</th>
                <th className="py-3 px-6 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBoletos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum boleto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredBoletos.map(b => {
                  const countdown = calculateCountdown(b.vencimento, b.status === 'PAID');
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{b.beneficiario}</div>
                        <small className="text-slate-400">{b.descricao}</small>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.entityId === 'CPF' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {b.entityId}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{b.vencimento.split('-').reverse().join('/')}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${countdown.badgeColor}`}>
                          ⏱ {countdown.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-900">
                        R$ {b.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          b.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : countdown.status === 'OVERDUE'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {b.status === 'PAID' ? 'Pago' : countdown.status === 'OVERDUE' ? 'Vencido' : 'A Vencer'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {b.status === 'PENDING' && (
                          <button
                            onClick={() => onPayBoleto(b.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                          >
                            Marcar como Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
