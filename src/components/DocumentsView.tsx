import React, { useState, useRef } from 'react';
import {
  DocumentItem,
  Transaction,
  Account,
  APP_CATEGORIES,
  AppCategory,
  OPERATION_TYPES,
  OPERATION_TYPE_LABELS,
  OperationType,
  ExtractedDocumentTransaction,
} from '../types';
import {
  parseCurrencyInput,
  formatCurrencyBRL,
  checkDuplicateTransaction,
  detectInternalTransfer,
} from '../utils/financeCalculations';
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
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react';

interface DocumentsViewProps {
  documents: DocumentItem[];
  accounts: Account[];
  transactions: Transaction[];
  onAddDocument: (doc: DocumentItem) => void;
  onAddTransactions: (items: Omit<Transaction, 'id'>[]) => void;
}

interface DraftRow {
  rowId: string;
  selected: boolean;
  description: string;
  amountStr: string;
  date: string;
  category: AppCategory;
  entity: 'CPF' | 'CNPJ';
  direction: 'INCOME' | 'EXPENSE';
  operationType: OperationType;
  counterparty: string;
  externalId: string;
  accountId: string;
  isInternalTransfer: boolean;
  requiresTransferConfirmation: boolean;
  transferConfirmed: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
  confidence: number;
  confidenceNote?: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  accounts,
  transactions,
  onAddDocument,
  onAddTransactions,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'reader'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [drafts, setDrafts] = useState<DraftRow[]>([]);

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

  const buildDraftsFromExtracted = (items: ExtractedDocumentTransaction[]): DraftRow[] => {
    const seenExternalIds = new Set<string>();
    const seenFingerprints = new Set<string>();

    return items.map((item, idx) => {
      const defaultAcc = accounts.find((a) => a.entityId === (item.entity || 'CPF')) || accounts[0];
      const extClean = (item.externalId || '').trim().toLowerCase();
      const fingerprint = `${item.date}|${Math.round(item.amount * 100)}|${item.description.trim().toLowerCase()}`;

      const existsInApp = checkDuplicateTransaction(transactions, {
        date: item.date,
        amount: item.amount,
        description: item.description,
        externalId: item.externalId,
      });

      const dupInBatch =
        (Boolean(extClean) && seenExternalIds.has(extClean)) || seenFingerprints.has(fingerprint);

      if (extClean) seenExternalIds.add(extClean);
      seenFingerprints.add(fingerprint);

      const isDup = existsInApp || dupInBatch;
      const autoInternal = detectInternalTransfer(item, accounts);
      const validCat: AppCategory = (APP_CATEGORIES as readonly string[]).includes(item.category)
        ? item.category
        : autoInternal
        ? 'Transferência'
        : 'Outros';

      return {
        rowId: `draft-${Date.now()}-${idx}`,
        selected: !isDup,
        description: item.description,
        amountStr: Number(item.amount || 0).toFixed(2).replace('.', ','),
        date: item.date,
        category: validCat,
        entity: item.entity || 'CPF',
        direction: item.direction || 'EXPENSE',
        operationType: (OPERATION_TYPES as readonly string[]).includes(item.operationType)
          ? item.operationType
          : autoInternal
          ? 'TRANSFERENCIA_PROPRIA'
          : 'OUTRO',
        counterparty: item.counterparty || '',
        externalId: item.externalId || '',
        accountId: defaultAcc?.id || '',
        isInternalTransfer: autoInternal,
        requiresTransferConfirmation: autoInternal,
        transferConfirmed: false,
        isDuplicate: isDup,
        duplicateReason: existsInApp
          ? extClean
            ? 'Mesmo ID/E2E ou lançamento idêntico já salvo'
            : 'Mesma data, valor e descrição já lançados'
          : dupInBatch
          ? 'Item repetido dentro deste documento'
          : undefined,
        confidence: typeof item.confidence === 'number' ? item.confidence : 0.7,
        confidenceNote: item.confidenceNote,
      };
    });
  };

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
    setDrafts([]);

    let extractedList: ExtractedDocumentTransaction[] | undefined;

    if (params.base64 || params.textContent) {
      try {
        const res = await fetch('/api/ai/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: params.fileName,
            textContent: params.textContent,
            knownAccounts: accounts.map((a) => ({
              institutionName: a.institutionName,
              accountName: a.accountName,
              entityId: a.entityId,
            })),
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
        } else if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          extractedList = data.transactions;
          setDrafts(buildDraftsFromExtracted(data.transactions));
        } else {
          setErrorMsg('Nenhum lançamento financeiro foi identificado neste documento.');
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
      status: extractedList ? 'PROCESSED' : 'PENDING',
      previewUrl: params.previewUrl,
      textContent: params.textContent,
      extractedTransactions: extractedList,
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

  const updateDraft = (rowId: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.rowId !== rowId) return d;
        const next = { ...d, ...patch };
        // Recompute duplicate check live when user edits date, amountStr, description, or externalId
        const parsedAmt = parseCurrencyInput(next.amountStr);
        if (!isNaN(parsedAmt) && next.date && next.description.trim()) {
          const dupApp = checkDuplicateTransaction(transactions, {
            date: next.date,
            amount: parsedAmt,
            description: next.description,
            externalId: next.externalId,
          });
          next.isDuplicate = dupApp;
          next.duplicateReason = dupApp ? 'Corresponde a lançamento já existente no sistema' : undefined;
        }
        return next;
      })
    );
  };

  const confirmAndSaveSelected = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const selected = drafts.filter((d) => d.selected);
    if (selected.length === 0) {
      setErrorMsg('Selecione ao menos um lançamento para salvar.');
      return;
    }

    const unconfirmedTransfers = selected.filter(
      (d) => d.requiresTransferConfirmation && d.isInternalTransfer && !d.transferConfirmed
    );
    if (unconfirmedTransfers.length > 0) {
      setErrorMsg(
        `Confirme ${unconfirmedTransfers.length} lançamento(s) marcado(s) automaticamente como transferência entre contas próprias antes de salvar.`
      );
      return;
    }

    const toCreate: Omit<Transaction, 'id'>[] = [];
    for (const row of selected) {
      const parsedAmount = parseCurrencyInput(row.amountStr);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMsg(`Valor inválido no lançamento "${row.description}". Corrija antes de salvar.`);
        return;
      }
      const acc = accounts.find((a) => a.id === row.accountId) || accounts[0];
      if (!acc) {
        setErrorMsg('Cadastre ou selecione uma conta bancária válida.');
        return;
      }

      toCreate.push({
        entityId: row.entity,
        accountId: acc.id,
        date: row.date,
        description: row.description.trim() || 'Documento digitalizado',
        category: row.category,
        account: `${acc.institutionName} · ${acc.accountName}`,
        amount: parsedAmount,
        direction: row.direction,
        status: 'CONFIRMED',
        origin: 'IMPORT',
        isInternalTransfer: row.isInternalTransfer,
        operationType: row.operationType,
        counterparty: row.counterparty.trim() || undefined,
        externalId: row.externalId.trim() || undefined,
      });
    }

    onAddTransactions(toCreate);
    const totalSaved = toCreate.reduce((sum, item) => sum + item.amount, 0);
    setDrafts([]);
    setSuccessMsg(
      `${toCreate.length} lançamento(s) salvo(s) após conferência (total movimentado: R$ ${formatCurrencyBRL(
        totalSaved
      )}).`
    );
  };

  const confidenceBadge = (score: number) => {
    const pct = Math.round(score * 100);
    if (pct >= 85) {
      return {
        label: `Confiança ${pct}% · Alta`,
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      };
    }
    if (pct >= 60) {
      return {
        label: `Confiança ${pct}% · Média`,
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      };
    }
    return {
      label: `Confiança ${pct}% · Baixa (revise)`,
      cls: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-300 dark:border-red-800',
    };
  };

  const readerThemeClass =
    readerTheme === 'sepia'
      ? 'bg-[#f4ecd8] text-[#433422]'
      : readerTheme === 'dark'
      ? 'bg-slate-950 text-slate-100'
      : 'bg-slate-50 text-slate-800';

  const selectedCount = drafts.filter((d) => d.selected).length;

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
          Extração multimodal em lote (vários lançamentos por PDF), classificação de operação (Pix/TED/Boleto/Cartão), ID E2E e pré-visualização antes de salvar.
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
              Importar extrato PDF, comprovante Pix/boleto ou livro
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Suporta múltiplos lançamentos por PDF, reconhecimento de E2E Pix, pagador/recebedor e detecção automática de duplicidade.
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
            Extraindo lançamentos, tipo de operação, E2E/ID e confiança via Gemini multimodal...
          </p>
        </div>
      )}

      {/* Multi-transaction Preview & Correction UI */}
      {drafts.length > 0 && !analyzing && (
        <form
          onSubmit={confirmAndSaveSelected}
          className="bg-white dark:bg-slate-900 border-2 border-emerald-500/60 dark:border-emerald-700 p-4 sm:p-6 rounded-2xl shadow-md space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#14263d] dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Pré-visualização e Conferência ({drafts.length} lançamento{drafts.length !== 1 ? 's' : ''})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Revise o grau de confiança, corrija qualquer campo e confirme antes de gravar no sistema.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrafts([])}
                className="px-4 min-h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Descartar Tudo
              </button>
              <button
                type="submit"
                className="px-5 min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmar e Salvar ({selectedCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {drafts.map((row, idx) => {
              const conf = confidenceBadge(row.confidence);
              return (
                <div
                  key={row.rowId}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    row.isDuplicate
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Top meta bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => updateDraft(row.rowId, { selected: e.target.checked })}
                        className="w-5 h-5 min-h-5 accent-emerald-600"
                      />
                      <span className="text-xs sm:text-sm font-bold text-[#14263d] dark:text-white">
                        Item #{idx + 1} · {OPERATION_TYPE_LABELS[row.operationType]}
                      </span>
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${conf.cls}`}>
                        {conf.label}
                      </span>
                      {row.isDuplicate && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {row.duplicateReason || 'Possível duplicidade'}
                        </span>
                      )}
                    </div>
                  </div>

                  {row.confidenceNote && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-700">
                      Observação da leitura: {row.confidenceNote}
                    </p>
                  )}

                  {row.requiresTransferConfirmation && row.isInternalTransfer && (
                    <div className="p-3 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <ArrowLeftRight size={16} className="shrink-0" />
                        <span>
                          <strong>Transferência própria detectada:</strong> origem e destino correspondem às suas contas. Confirme antes de salvar.
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-100 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.transferConfirmed}
                          onChange={(e) =>
                            updateDraft(row.rowId, { transferConfirmed: e.target.checked })
                          }
                          className="w-5 h-5 min-h-5 accent-amber-700"
                        />
                        Confirmar transferência
                      </label>
                    </div>
                  )}

                  {/* Editable Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        required
                        value={row.description}
                        onChange={(e) => updateDraft(row.rowId, { description: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Valor (R$)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={row.amountStr}
                        onChange={(e) => updateDraft(row.rowId, { amountStr: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Data
                      </label>
                      <input
                        type="date"
                        required
                        value={row.date}
                        onChange={(e) => updateDraft(row.rowId, { date: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Tipo de operação
                      </label>
                      <select
                        value={row.operationType}
                        onChange={(e) => {
                          const op = e.target.value as OperationType;
                          updateDraft(row.rowId, {
                            operationType: op,
                            isInternalTransfer: op === 'TRANSFERENCIA_PROPRIA' ? true : row.isInternalTransfer,
                          });
                        }}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      >
                        {OPERATION_TYPES.map((op) => (
                          <option key={op} value={op}>
                            {OPERATION_TYPE_LABELS[op]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Categoria (lista do app)
                      </label>
                      <select
                        value={row.category}
                        onChange={(e) =>
                          updateDraft(row.rowId, { category: e.target.value as AppCategory })
                        }
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      >
                        {APP_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Natureza / Vínculo
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={row.direction}
                          onChange={(e) =>
                            updateDraft(row.rowId, { direction: e.target.value as 'INCOME' | 'EXPENSE' })
                          }
                          className="border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                        >
                          <option value="EXPENSE">Saída (−)</option>
                          <option value="INCOME">Entrada (+)</option>
                        </select>
                        <select
                          value={row.entity}
                          onChange={(e) =>
                            updateDraft(row.rowId, { entity: e.target.value as 'CPF' | 'CNPJ' })
                          }
                          className="border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Conta vinculada
                      </label>
                      <select
                        value={row.accountId}
                        onChange={(e) => updateDraft(row.rowId, { accountId: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.institutionName} · {a.accountName} ({a.entityId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Pagador / Recebedor
                      </label>
                      <input
                        type="text"
                        placeholder="Nome ou razão social"
                        value={row.counterparty}
                        onChange={(e) => updateDraft(row.rowId, { counterparty: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        ID da transação / E2E Pix (deduplicação)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex.: E00000000202611..."
                        value={row.externalId}
                        onChange={(e) => updateDraft(row.rowId, { externalId: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-11"
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={row.isInternalTransfer}
                      onChange={(e) =>
                        updateDraft(row.rowId, {
                          isInternalTransfer: e.target.checked,
                          transferConfirmed: e.target.checked ? true : false,
                        })
                      }
                      className="w-4 h-4 min-h-4 accent-emerald-600"
                    />
                    <span>Transferência entre contas próprias (não somar como receita/despesa)</span>
                  </label>
                </div>
              );
            })}
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
                    {d.extractedTransactions && ` · ${d.extractedTransactions.length} lançamento(s)`}
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
