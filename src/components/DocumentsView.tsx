import React, { useState, useRef } from 'react';
import { DocumentItem, Transaction, Account } from '../types';
import { parseCurrencyInput, formatCurrencyBRL } from '../utils/financeCalculations';
import {
  FileSearch,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

interface DocumentsViewProps {
  documents: DocumentItem[];
  accounts: Account[];
  onAddDocument: (doc: DocumentItem) => void;
  onAddTransaction: (tr: Omit<Transaction, 'id'>) => void;
}

interface ExtractedDraft {
  description: string;
  amountStr: string;
  date: string;
  category: string;
  entity: 'CPF' | 'CNPJ';
  direction: 'INCOME' | 'EXPENSE';
  accountId: string;
  confidenceNote?: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  accounts,
  onAddDocument,
  onAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'reader'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [draft, setDraft] = useState<ExtractedDraft | null>(null);

  // Reader state
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setActiveTab('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setErrorMsg('Não foi possível acessar a câmera do dispositivo. Verifique as permissões do navegador.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
      reader.readAsDataURL(file);
    });

  const analyzeMultimodal = async (params: {
    fileName: string;
    mimeType: string;
    base64?: string;
    previewUrl?: string;
    textContent?: string;
    sizeLabel: string;
    docType: DocumentItem['type'];
  }) => {
    setAnalyzing(true);
    setErrorMsg('');
    setSuccessMsg('');

    let extracted: DocumentItem['extractedData'] | undefined;

    if (params.base64 || params.textContent) {
      try {
        const res = await fetch('/api/ai/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: params.fileName,
            textContent: params.textContent,
            fileData:
              params.base64 && /^(application\/pdf|image\/(png|jpeg|jpg|webp))$/.test(params.mimeType)
                ? { mimeType: params.mimeType, base64: params.base64 }
                : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(
            data.error ||
              'Não foi possível extrair os dados com IA. Você pode visualizar o documento no leitor ou cadastrar manualmente.'
          );
        } else if (data.extracted) {
          extracted = data.extracted;
          const defaultAcc =
            accounts.find((a) => a.entityId === (data.extracted.entity || 'CPF')) || accounts[0];
          setDraft({
            description: data.extracted.description || params.fileName,
            amountStr: Number(data.extracted.amount || 0).toFixed(2).replace('.', ','),
            date: data.extracted.date || new Date().toISOString().split('T')[0],
            category: data.extracted.category || 'Outros',
            entity: data.extracted.entity || 'CPF',
            direction: data.extracted.direction || 'EXPENSE',
            accountId: defaultAcc?.id || '',
            confidenceNote: data.extracted.confidenceNote,
          });
        }
      } catch {
        setErrorMsg('Erro de comunicação com o servidor de análise documental.');
      }
    }

    const newDoc: DocumentItem = {
      id: 'doc-' + Date.now(),
      name: params.fileName,
      type: params.docType,
      date: new Date().toLocaleDateString('pt-BR'),
      size: params.sizeLabel,
      status: extracted ? 'PROCESSED' : 'PENDING',
      previewUrl: params.previewUrl,
      textContent: params.textContent,
      extractedData: extracted,
    };

    onAddDocument(newDoc);
    setSelectedDoc(newDoc);
    setZoomLevel(100);
    setRotation(0);
    setAnalyzing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    stopCamera();

    const base64 = dataUrl.split(',')[1];
    await analyzeMultimodal({
      fileName: `Comprovante_${new Date().toISOString().slice(0, 10)}.png`,
      mimeType: 'image/png',
      base64,
      previewUrl: dataUrl,
      sizeLabel: `${Math.round((base64.length * 3) / 4 / 1024)} KB`,
      docType: 'Imagem',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    const sizeLabel =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    if (ext.endsWith('.epub')) {
      const previewUrl = URL.createObjectURL(file);
      const newDoc: DocumentItem = {
        id: 'doc-' + Date.now(),
        name: file.name,
        type: 'EPUB',
        date: new Date().toLocaleDateString('pt-BR'),
        size: sizeLabel,
        status: 'PENDING',
        previewUrl,
        textContent:
          'Arquivo EPUB carregado localmente. Navegadores não renderizam pacotes EPUB compactados nativamente sem leitor dedicado; use o botão Baixar para abrir no leitor do dispositivo.',
      };
      onAddDocument(newDoc);
      setSelectedDoc(newDoc);
      setActiveTab('reader');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const base64 = dataUrl.split(',')[1];
      const mimeType =
        file.type || (ext.endsWith('.pdf') ? 'application/pdf' : ext.endsWith('.png') ? 'image/png' : 'image/jpeg');

      await analyzeMultimodal({
        fileName: file.name,
        mimeType,
        base64,
        previewUrl: dataUrl,
        sizeLabel,
        docType: ext.endsWith('.pdf') ? 'PDF' : 'Imagem',
      });
    } catch {
      setErrorMsg('Não foi possível ler o arquivo selecionado.');
    }
  };

  const confirmExtractedTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;

    const parsedAmount = parseCurrencyInput(draft.amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor válido maior que zero antes de salvar o lançamento.');
      return;
    }
    const chosenAcc = accounts.find((a) => a.id === draft.accountId) || accounts[0];
    if (!chosenAcc) {
      setErrorMsg('Selecione uma conta bancária válida.');
      return;
    }

    onAddTransaction({
      entityId: draft.entity,
      accountId: chosenAcc.id,
      date: draft.date,
      description: draft.description.trim() || 'Documento digitalizado',
      category: draft.category,
      account: `${chosenAcc.institutionName} · ${chosenAcc.accountName}`,
      amount: parsedAmount,
      direction: draft.direction,
      status: 'CONFIRMED',
      origin: 'IMPORT',
    });

    setDraft(null);
    setSuccessMsg(
      `Lançamento de R$ ${formatCurrencyBRL(parsedAmount)} vinculado à conta ${chosenAcc.institutionName}!`
    );
  };

  const readerThemeClass =
    readerTheme === 'sepia'
      ? 'bg-[#f4ecd8] text-[#433422]'
      : readerTheme === 'dark'
      ? 'bg-slate-950 text-slate-100'
      : 'bg-slate-50 text-slate-800';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md text-[10px] font-bold">
            CENTRAL DE DOCUMENTOS
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#14263d] dark:text-white">
            Leitor PDF, EPUB & Scanner OCR
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Visualize PDFs e imagens reais com zoom e rotação, ou envie comprovantes para extração multimodal via Gemini.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            stopCamera();
          }}
          className={`px-4 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-[#14263d] dark:bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" /> Importar Arquivo (PDF / Imagem / EPUB)
        </button>

        <button
          type="button"
          onClick={startCamera}
          className={`px-4 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" /> Scanner Câmera Mobile
        </button>

        {selectedDoc && (
          <button
            type="button"
            onClick={() => setActiveTab('reader')}
            className={`px-4 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reader'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Visualizador ({selectedDoc.name})
          </button>
        )}
      </div>

      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-full grid place-items-center mx-auto">
            <FileSearch className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
              Importar documento financeiro ou comprovante
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Suporta PDF, PNG, JPG/JPEG (com extração multimodal real) e EPUB.
            </p>
          </div>

          <label className="inline-flex items-center justify-center min-h-12 bg-[#14263d] hover:bg-[#1d3552] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-6 rounded-xl text-sm font-bold cursor-pointer shadow-sm transition-all">
            Selecionar arquivo do dispositivo
            <input
              type="file"
              accept=".pdf,.epub,.png,.jpg,.jpeg,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {activeTab === 'camera' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4 text-center">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
            Scanner ao vivo via Câmera
          </h3>

          <div className="relative w-full max-w-md mx-auto aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
            {cameraActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
            ) : capturedImage ? (
              <img src={capturedImage} alt="Documento capturado" className="w-full h-full object-contain" />
            ) : (
              <p className="text-xs text-slate-400">Aguardando câmera...</p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {cameraActive ? (
              <button
                type="button"
                onClick={capturePhoto}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 min-h-12 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Capturar Documento
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="bg-[#14263d] hover:bg-[#1d3552] text-white px-6 min-h-12 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Ativar Câmera
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reader' && selectedDoc && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#14263d] dark:text-white">{selectedDoc.name}</h3>
              <p className="text-xs text-slate-400">
                Tipo: {selectedDoc.type} · {selectedDoc.size}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="min-w-10 min-h-10 grid place-items-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-12 text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                className="min-w-10 min-h-10 grid place-items-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {selectedDoc.type === 'Imagem' && (
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="min-w-10 min-h-10 grid place-items-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Girar 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}
              <select
                aria-label="Tema de leitura"
                value={readerTheme}
                onChange={(e) => setReaderTheme(e.target.value as 'light' | 'sepia' | 'dark')}
                className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 min-h-10"
              >
                <option value="light">Claro</option>
                <option value="sepia">Sépia</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
          </div>

          <div
            className={`${readerThemeClass} border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[420px] overflow-auto flex items-center justify-center`}
          >
            {selectedDoc.type === 'PDF' && selectedDoc.previewUrl ? (
              <iframe
                title={selectedDoc.name}
                src={selectedDoc.previewUrl}
                className="w-full h-[520px] rounded-lg border-0 bg-white"
              />
            ) : selectedDoc.type === 'Imagem' && selectedDoc.previewUrl ? (
              <img
                src={selectedDoc.previewUrl}
                alt={selectedDoc.name}
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
                className="max-w-full max-h-[500px] object-contain transition-transform"
              />
            ) : (
              <div className="max-w-xl text-center space-y-4 p-4">
                <p className="text-sm leading-relaxed">
                  {selectedDoc.textContent || 'Arquivo carregado localmente.'}
                </p>
                {selectedDoc.previewUrl && (
                  <a
                    href={selectedDoc.previewUrl}
                    download={selectedDoc.name}
                    className="inline-flex items-center gap-2 px-4 min-h-11 bg-[#14263d] text-white rounded-xl text-xs font-bold"
                  >
                    Baixar {selectedDoc.name}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {analyzing && (
        <div className="p-6 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl text-center space-y-3 animate-pulse">
          <Sparkles className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200">
            Enviando documento real ao Gemini multimodal para conferência...
          </p>
        </div>
      )}

      {/* Confirmation Form before saving transaction */}
      {draft && !analyzing && (
        <form
          onSubmit={confirmExtractedTransaction}
          className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Confira os dados extraídos antes de salvar
            </h3>
            {draft.confidenceNote && (
              <span className="text-xs text-emerald-800 dark:text-emerald-300">{draft.confidenceNote}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/60 dark:border-slate-700">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Descrição</label>
              <input
                type="text"
                required
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-11"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={draft.amountStr}
                onChange={(e) => setDraft({ ...draft, amountStr: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-11"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Data</label>
              <input
                type="date"
                required
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-11"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Conta vinculada</label>
              <select
                value={draft.accountId}
                onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-11"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.institutionName} · {a.accountName} ({a.entityId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Vínculo</label>
              <select
                value={draft.entity}
                onChange={(e) => setDraft({ ...draft, entity: e.target.value as 'CPF' | 'CNPJ' })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-11"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Categoria</label>
              <input
                type="text"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-11"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="px-4 min-h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Descartar
            </button>
            <button
              type="submit"
              className="px-5 min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Confirmar e Salvar Lançamento
            </button>
          </div>
        </form>
      )}

      {/* History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#14263d] dark:text-white">
            Documentos carregados na sessão
          </h3>
          <span className="text-xs text-slate-400">{documents.length} itens</span>
        </div>

        {documents.length === 0 ? (
          <p className="p-6 text-center text-xs sm:text-sm text-slate-400">
            Nenhum documento importado ainda. Selecione um PDF, imagem ou EPUB acima.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map((d) => (
              <div key={d.id} className="p-4 sm:px-6 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{d.name}</div>
                  <div className="text-xs text-slate-400">
                    {d.type} · {d.date} · {d.size}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoc(d);
                    setActiveTab('reader');
                  }}
                  className="px-3.5 min-h-10 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  Abrir Leitor
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
