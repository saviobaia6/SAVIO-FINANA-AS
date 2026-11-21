import React, { useState } from 'react';
import { FolderOpen, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ImportsView: React.FC = () => {
  const [fileName, setFileName] = useState('');
  const [imported, setImported] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      setImported(true);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-extrabold text-[#14263d]">Extratos e Open Finance</h2>
        <p className="text-xs text-slate-500">
          Central de importação, leitura de extratos OFX/CSV e conciliação bancária inteligente.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center gap-3">
        <span className="font-bold">🔒 Segurança:</span> A conexão Open Finance depende de consentimento do titular e ambiente seguro. Nenhuma credencial bancária é armazenada.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#14263d]">Importar arquivo de extrato</h3>
          <p className="text-xs text-slate-400">
            Suporta arquivos OFX, CSV e extratos bancários digitais. A IA interpretará os lançamentos automaticamente.
          </p>

          <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-700">Clique para selecionar arquivo</span>
            <span className="text-[11px] text-slate-400 mt-1">.ofx, .csv, .pdf</span>
            <input type="file" accept=".ofx,.csv,.pdf,.xlsx" onChange={handleFileChange} className="hidden" />
          </label>

          {fileName && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Arquivo selecionado: <strong>{fileName}</strong>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#14263d]">Fluxo de classificação inteligente</h3>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-[#14263d] text-white font-bold grid place-items-center text-[10px]">1</span>
              <span>Identificar conta e titularidade (CPF / CNPJ)</span>
            </li>
            <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-[#14263d] text-white font-bold grid place-items-center text-[10px]">2</span>
              <span>Identificar pagador / recebedor e histórico</span>
            </li>
            <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-[#14263d] text-white font-bold grid place-items-center text-[10px]">3</span>
              <span>Sugerir categoria e natureza fiscal</span>
            </li>
            <li className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="w-6 h-6 rounded-full bg-[#14263d] text-white font-bold grid place-items-center text-[10px]">4</span>
              <span>Confirmar e conciliar lançamentos</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
