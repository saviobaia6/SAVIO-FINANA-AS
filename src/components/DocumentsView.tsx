import React, { useState, useRef } from 'react';
import { DocumentItem, Transaction } from '../types';
import { FileSearch, Camera, Upload, CheckCircle2, Sparkles, X, RefreshCw } from 'lucide-react';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onAddTransaction: (tr: Omit<Transaction, 'id'>) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onAddDocument,
  onAddTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [extractedResult, setExtractedResult] = useState<any>(null);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setActiveTab('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      alert('Não foi possível acessar a câmera do dispositivo. Verifique as permissões do navegador.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
        processAiText('Documento fotografado via Câmera Celular', 'Foto_Comprovante.png');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processAiText(`Conteúdo simulado extraído do arquivo ${file.name} via OCR inteligente.`, file.name);
    }
  };

  const processAiText = async (textSample: string, fileName: string) => {
    setAnalyzing(true);
    setPreviewText(textSample);

    try {
      const res = await fetch('/api/ai/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: textSample, fileName })
      });
      const data = await res.json();
      setExtractedResult(data.extracted);

      const newDoc: DocumentItem = {
        id: 'doc-' + Date.now(),
        name: fileName,
        type: fileName.endsWith('.pdf') ? 'PDF' : 'Imagem/Foto',
        date: new Date().toLocaleDateString('pt-BR'),
        size: '320 KB',
        status: 'PROCESSED',
        extractedData: data.extracted
      };
      onAddDocument(newDoc);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar documento com IA.');
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmExtractedTransaction = () => {
    if (!extractedResult) return;
    onAddTransaction({
      entityId: extractedResult.entity || 'CPF',
      date: extractedResult.date || new Date().toISOString().split('T')[0],
      description: extractedResult.description || 'Documento OCR',
      category: extractedResult.category || 'Outros',
      account: 'Banco Inter',
      amount: extractedResult.amount || 100.00,
      direction: extractedResult.direction || 'EXPENSE',
      status: 'CONFIRMED',
      origin: 'IMPORT'
    });
    alert('Transação criada com sucesso a partir da extração do documento!');
    setExtractedResult(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">OCR & IA</span>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Leitor Inteligente de Documentos & Scanner</h2>
        </div>
        <p className="text-xs text-slate-500">
          Importe PDFs, imagens ou utilize a câmera do celular para fotografar faturas, notas fiscais e extratos.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => { setActiveTab('upload'); stopCamera(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'upload' ? 'bg-[#14263d] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" /> Importar Arquivo (PDF / Imagem)
        </button>
        <button
          onClick={startCamera}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'camera' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-4 h-4" /> Câmera do Dispositivo / Scanner
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full grid place-items-center mx-auto">
            <FileSearch className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#14263d]">Selecione um documento digital</h3>
            <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, JPEG com reconhecimento automático por OCR.</p>
          </div>

          <label className="inline-block bg-[#14263d] hover:bg-[#1d3552] text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all">
            Escolher arquivo do computador
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {activeTab === 'camera' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 text-center">
          <h3 className="text-sm font-bold text-[#14263d]">Captura ao vivo pela câmera</h3>
          
          <div className="relative w-full max-w-md mx-auto aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
            {cameraActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
            ) : capturedImage ? (
              <img src={capturedImage} alt="Captura" className="w-full h-full object-contain" />
            ) : (
              <p className="text-xs text-slate-400">Iniciando câmera...</p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {cameraActive ? (
              <button
                onClick={capturePhoto}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Capturar Documento
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="bg-[#14263d] hover:bg-[#1d3552] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reiniciar Câmera
              </button>
            )}
          </div>
        </div>
      )}

      {analyzing && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-3 animate-pulse">
          <Sparkles className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-xs font-bold text-blue-900">IA executando OCR e extraindo dados financeiros...</p>
        </div>
      )}

      {extractedResult && !analyzing && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Dados Extraídos com Sucesso
            </h3>
            <span className="px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-bold">
              {extractedResult.entity}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-emerald-200/60 text-xs">
            <div>
              <span className="text-slate-400 block">Descrição</span>
              <strong className="text-slate-800">{extractedResult.description}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Categoria</span>
              <strong className="text-slate-800">{extractedResult.category}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Valor</span>
              <strong className="text-emerald-700 font-bold">R$ {extractedResult.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Data</span>
              <strong className="text-slate-800">{extractedResult.date}</strong>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setExtractedResult(null)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={confirmExtractedTransaction}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              Confirmar e Salvar Transação
            </button>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Documentos processados recentemente</h3>
          <span className="text-xs text-slate-400">{documents.length} documentos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="py-3 px-6 font-semibold">Nome do arquivo</th>
                <th className="py-3 px-6 font-semibold">Tipo</th>
                <th className="py-3 px-6 font-semibold">Data</th>
                <th className="py-3 px-6 font-semibold">Tamanho</th>
                <th className="py-3 px-6 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">{d.name}</td>
                  <td className="py-4 px-6 text-slate-600">{d.type}</td>
                  <td className="py-4 px-6 text-slate-500">{d.date}</td>
                  <td className="py-4 px-6 text-slate-500">{d.size}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">
                      Processado por IA
                    </span>
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
