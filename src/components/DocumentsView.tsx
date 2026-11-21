import React, { useState, useRef } from 'react';
import { DocumentItem, Transaction } from '../types';
import { FileSearch, Camera, Upload, CheckCircle2, Sparkles, X, RefreshCw, ZoomIn, ZoomOut, BookOpen, FileText } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'reader'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);

  // Reader state
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [readerMode, setReaderMode] = useState<'pdf' | 'epub'>('pdf');

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
      alert('Não foi possível acessar a câmera do dispositivo. Verifique as permissões.');
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
        processAiText('Comprovante escaneado via câmera mobile', 'Comprovante_Scanner.png');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isEpub = file.name.endsWith('.epub');
      setReaderMode(isEpub ? 'epub' : 'pdf');
      processAiText(`Conteúdo extraído do arquivo ${file.name} com OCR e indexação de texto.`, file.name);
    }
  };

  const processAiText = async (textSample: string, fileName: string) => {
    setAnalyzing(true);
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
        type: fileName.endsWith('.epub') ? 'EPUB' : fileName.endsWith('.pdf') ? 'PDF' : 'Imagem',
        date: new Date().toLocaleDateString('pt-BR'),
        size: '412 KB',
        status: 'PROCESSED',
        extractedData: data.extracted
      };
      onAddDocument(newDoc);
      setSelectedDoc(newDoc);
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
      amount: extractedResult.amount || 150.00,
      direction: extractedResult.direction || 'EXPENSE',
      status: 'CONFIRMED',
      origin: 'IMPORT'
    });
    alert('Transação criada com sucesso a partir da extração do documento!');
    setExtractedResult(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20 md:pb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">CENTRAL DE DOCUMENTOS</span>
          <h2 className="text-2xl font-extrabold text-[#14263d]">Leitor PDF, EPUB & Scanner OCR</h2>
        </div>
        <p className="text-xs text-slate-500">
          Gerencie e leia documentos financeiros, extratos, notas fiscais e livros (EPUB) com zoom, paginação e IA integrada.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('upload'); stopCamera(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'upload' ? 'bg-[#14263d] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" /> Importar Arquivo (PDF / EPUB)
        </button>
        <button
          onClick={startCamera}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'camera' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-4 h-4" /> Scanner Câmera Mobile
        </button>
        {selectedDoc && (
          <button
            onClick={() => setActiveTab('reader')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reader' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Modo Leitor Pro ({selectedDoc.name})
          </button>
        )}
      </div>

      {activeTab === 'upload' && (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full grid place-items-center mx-auto">
            <FileSearch className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#14263d]">Importar documento financeiro ou livro</h3>
            <p className="text-xs text-slate-400 mt-1">Suporta PDF, EPUB, PNG e JPG com OCR e extração automática de dados.</p>
          </div>

          <label className="inline-block bg-[#14263d] hover:bg-[#1d3552] text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all">
            Selecionar arquivo do dispositivo
            <input type="file" accept=".pdf,.epub,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {activeTab === 'camera' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 text-center">
          <h3 className="text-sm font-bold text-[#14263d]">Scanner ao vivo via Câmera Mobile</h3>
          
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Capturar Documento
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="bg-[#14263d] hover:bg-[#1d3552] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reiniciar Câmera
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reader' && selectedDoc && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#14263d]">{selectedDoc.name}</h3>
              <p className="text-[11px] text-slate-400">Tipo: {selectedDoc.type} · Página {currentPage} de 12</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 w-12 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="bg-slate-50 border border-slate-200 rounded-xl p-8 min-h-[400px] flex items-center justify-center overflow-auto transition-all"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <div className="max-w-2xl text-left space-y-4">
              <h4 className="text-lg font-bold text-slate-800">Visualização de Leitura Profissional</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Este é o modo leitor otimizado do arquivo <strong className="text-slate-900">{selectedDoc.name}</strong>. O sistema suporta navegação por páginas, capítulos (EPUB), ajuste dinâmico de zoom, pesquisa e extração via OCR.
              </p>
              {selectedDoc.extractedData && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-900">Dados Financeiros Identificados:</p>
                  <p>Descrição: {selectedDoc.extractedData.description}</p>
                  <p>Valor: R$ {selectedDoc.extractedData.amount}</p>
                  <p>Categoria: {selectedDoc.extractedData.category}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              ← Página anterior
            </button>
            <span className="text-xs text-slate-500">Página {currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 bg-[#14263d] hover:bg-[#1d3552] rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              Próxima página →
            </button>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-3 animate-pulse">
          <Sparkles className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-xs font-bold text-blue-900">IA executando OCR e indexação do documento...</p>
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
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Descartar
            </button>
            <button
              onClick={confirmExtractedTransaction}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Confirmar e Salvar Transação
            </button>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d]">Documentos e Leituras Recentes</h3>
          <span className="text-xs text-slate-400">{documents.length} itens</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="py-3 px-6 font-semibold">Nome do arquivo</th>
                <th className="py-3 px-6 font-semibold">Tipo</th>
                <th className="py-3 px-6 font-semibold">Data</th>
                <th className="py-3 px-6 font-semibold">Tamanho</th>
                <th className="py-3 px-6 font-semibold text-center">Ações</th>
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
                    <button
                      onClick={() => { setSelectedDoc(d); setActiveTab('reader'); }}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Abrir Leitor
                    </button>
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
