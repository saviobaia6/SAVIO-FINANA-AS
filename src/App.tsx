import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  EntityScope,
  Transaction,
  Boleto,
  DocumentItem,
  Account,
  CreditCard,
  Debt,
  Asset,
} from './types';
import type { SalaryDataset } from './types/salary';
import {
  initialTransactions,
  initialAccounts,
  initialCreditCards,
  initialBoletos,
  initialDebts,
  initialAssets,
  initialDocuments,
} from './data/initialData';
import { calculateAccountBalances } from './utils/financeCalculations';
import {
  todayLocal,
  currentMonthLocal,
  buildDynamicPeriodOptions,
} from './utils/dateUtils';
import {
  STORAGE_KEYS,
  STORAGE_SCHEMA_VERSION,
  loadJsonWithRecovery,
  saveJsonSafe,
  readStringSafe,
  writeStringSafe,
  clearEntityStoragePreservingBackups,
} from './services/storage';
import { fileStorageService } from './services/fileStorage';
import {
  FullBackupPayload,
  PreResetSnapshot,
  applyBackupDataset,
  sanitizeDocumentsForMetadata,
  savePreOperationSnapshot,
  validateDatasetIntegrity,
} from './services/backupService';
import { runSafeStorageMigration, mirrorDatasetToDexie } from './services/storageMigration';
import { canDeleteAccount } from './services/accountService';
import {
  EMPTY_SALARY_DATASET,
  backupSalaryBeforeImport,
  loadSalaryDatasetWithRecovery,
  saveSalaryDatasetSafely,
} from './services/salaryStorage';
import { MONTHS_PT_FULL } from './types/salary';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TransactionModal } from './components/TransactionModal';
import { DashboardView } from './components/DashboardView';
import { CpfView } from './components/CpfView';
import { CnpjView } from './components/CnpjView';
import { AccountsView } from './components/AccountsView';
import { CardsView } from './components/CardsView';
import { BoletosView } from './components/BoletosView';
import { DebtsView } from './components/DebtsView';
import { PlanningView } from './components/PlanningView';
import { AssetsView } from './components/AssetsView';
import { ImportsView } from './components/ImportsView';
import { DocumentsView } from './components/DocumentsView';
import { AiAssistantView } from './components/AiAssistantView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InvestmentDashboard } from './components/investments/InvestmentDashboard';
import { SalaryView } from './components/salary/SalaryView';
import { RotateCcw, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [scope, setScope] = useState<EntityScope>('CONSOLIDATED');
  const [period, setPeriod] = useState(() => currentMonthLocal());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultModalEntity, setDefaultModalEntity] = useState<'CPF' | 'CNPJ'>('CPF');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [pendingUndo, setPendingUndo] = useState<{
    label: string;
    restore: () => void;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docDeleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const triggerUndo = useCallback((label: string, restore: () => void) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setPendingUndo({ label, restore });
    undoTimerRef.current = setTimeout(() => {
      setPendingUndo(null);
      undoTimerRef.current = null;
    }, 7000);
  }, []);

  const executeUndo = () => {
    if (!pendingUndo) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    pendingUndo.restore();
    setPendingUndo(null);
  };

  // Ergonomics & Theme state synced safely
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = readStringSafe(STORAGE_KEYS.theme, 'light');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [density, setDensity] = useState<'compact' | 'standard' | 'enlarged'>(() => {
    const saved = readStringSafe(STORAGE_KEYS.density, 'standard');
    return saved === 'compact' || saved === 'enlarged' ? saved : 'standard';
  });

  const [zoom, setZoom] = useState<string>(() => {
    return readStringSafe(STORAGE_KEYS.zoom, '100%');
  });

  useEffect(() => {
    writeStringSafe(STORAGE_KEYS.theme, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    writeStringSafe(STORAGE_KEYS.density, density);
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  useEffect(() => {
    writeStringSafe(STORAGE_KEYS.zoom, zoom);
    document.documentElement.style.fontSize = zoom;
  }, [zoom]);

  // Persistent Entities State with safe loading + corrupt payload preservation
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const res = loadJsonWithRecovery<Account[]>(
      STORAGE_KEYS.accounts,
      initialAccounts,
      Array.isArray
    );
    if (res.error) setStorageWarning(res.error);
    return res.data.map((a) => ({
      ...a,
      openingBalance: typeof a.openingBalance === 'number' ? a.openingBalance : a.balance ?? 0,
    }));
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const res = loadJsonWithRecovery<Transaction[]>(
      STORAGE_KEYS.transactions,
      initialTransactions,
      Array.isArray
    );
    if (res.error) setStorageWarning((prev) => prev || res.error || null);

    const accRes = loadJsonWithRecovery<Account[]>(
      STORAGE_KEYS.accounts,
      initialAccounts,
      Array.isArray
    );
    const fallbackAccounts = accRes.data;

    return res.data.map((t) => {
      if (t.accountId) return t;
      const match =
        fallbackAccounts.find(
          (a) =>
            t.account &&
            (a.institutionName.toLowerCase().includes(t.account.toLowerCase()) ||
              t.account.toLowerCase().includes(a.institutionName.toLowerCase()))
        ) ||
        fallbackAccounts.find((a) => a.entityId === t.entityId) ||
        fallbackAccounts[0];
      return {
        ...t,
        accountId: match?.id || 'acc-1',
      };
    });
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    const res = loadJsonWithRecovery<CreditCard[]>(
      STORAGE_KEYS.cards,
      initialCreditCards,
      Array.isArray
    );
    if (res.error) setStorageWarning((prev) => prev || res.error || null);
    return res.data;
  });

  const [boletos, setBoletos] = useState<Boleto[]>(() => {
    const res = loadJsonWithRecovery<Boleto[]>(
      STORAGE_KEYS.boletos,
      initialBoletos,
      Array.isArray
    );
    if (res.error) setStorageWarning((prev) => prev || res.error || null);
    return res.data;
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const res = loadJsonWithRecovery<Debt[]>(STORAGE_KEYS.debts, initialDebts, Array.isArray);
    if (res.error) setStorageWarning((prev) => prev || res.error || null);
    return res.data;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const res = loadJsonWithRecovery<Asset[]>(STORAGE_KEYS.assets, initialAssets, Array.isArray);
    if (res.error) setStorageWarning((prev) => prev || res.error || null);
    return res.data;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const res = loadJsonWithRecovery<DocumentItem[]>(
      STORAGE_KEYS.docs,
      initialDocuments,
      Array.isArray
    );
    if (res.error) setStorageWarning((prev) => prev || res.error || null);
    return res.data;
  });

  const [salaryData, setSalaryData] = useState<SalaryDataset>(() => {
    const res = loadSalaryDatasetWithRecovery();
    if (res.error) setStorageWarning((prev) => prev || res.error || null);
    return res.data;
  });

  const [preResetSnapshot, setPreResetSnapshot] = useState<PreResetSnapshot | null>(() => {
    const res = loadJsonWithRecovery<PreResetSnapshot | null>(
      STORAGE_KEYS.preResetSnapshot,
      null,
      (val) => Boolean(val && typeof val === 'object' && 'backup' in val)
    );
    return res.data;
  });

  // Safe migration on startup: moves legacy base64 docs to SavioFinanaDB and mirrors entities without localStorage.clear()
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await runSafeStorageMigration({
        dataset: {
          accounts,
          transactions,
          creditCards,
          boletos,
          debts,
          assets,
          documents,
        },
        settings: { theme, density, zoom },
      });
      if (!active) return;
      if (!res.ok && res.error) {
        setStorageWarning(res.error);
      } else if (res.migratedLegacyDocsCount > 0 && res.cleanedDocuments) {
        setDocuments(res.cleanedDocuments);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Derived account balances: openingBalance + sum(transactions by accountId)
  const derivedAccounts = useMemo(
    () => calculateAccountBalances(accounts, transactions),
    [accounts, transactions]
  );

  const periodOptions = useMemo(
    () => buildDynamicPeriodOptions(transactions, boletos),
    [transactions, boletos]
  );

  const persistSafely = (key: string, value: unknown) => {
    const res = saveJsonSafe(key, value);
    if (!res.ok && res.error) {
      setStorageWarning(res.error);
    }
  };

  useEffect(() => {
    writeStringSafe(STORAGE_KEYS.schemaVersion, String(STORAGE_SCHEMA_VERSION));
  }, []);

  useEffect(() => {
    persistSafely(STORAGE_KEYS.transactions, transactions);
  }, [transactions]);

  useEffect(() => {
    persistSafely(STORAGE_KEYS.accounts, accounts);
  }, [accounts]);

  useEffect(() => {
    persistSafely(STORAGE_KEYS.cards, creditCards);
  }, [creditCards]);

  useEffect(() => {
    persistSafely(STORAGE_KEYS.boletos, boletos);
  }, [boletos]);

  useEffect(() => {
    persistSafely(STORAGE_KEYS.debts, debts);
  }, [debts]);

  useEffect(() => {
    persistSafely(STORAGE_KEYS.assets, assets);
  }, [assets]);

  useEffect(() => {
    // Strip any heavy base64 or blob URLs before saving metadata to localStorage
    persistSafely(STORAGE_KEYS.docs, sanitizeDocumentsForMetadata(documents));
  }, [documents]);

  useEffect(() => {
    const res = saveSalaryDatasetSafely(salaryData);
    if (!res.ok && res.error) {
      setStorageWarning(res.error);
    }
  }, [salaryData]);

  useEffect(() => {
    void mirrorDatasetToDexie(
      {
        accounts,
        transactions,
        creditCards,
        boletos,
        debts,
        assets,
        documents,
      },
      { theme, density, zoom }
    );
  }, [accounts, transactions, creditCards, boletos, debts, assets, documents, theme, density, zoom]);

  const createSafetySnapshot = (reason: PreResetSnapshot['reason']) => {
    const res = savePreOperationSnapshot(
      {
        accounts,
        transactions,
        creditCards,
        boletos,
        debts,
        assets,
        documents,
        salaries: salaryData,
        settings: { theme, density, zoom },
      },
      reason
    );
    if (res.ok) {
      setPreResetSnapshot(res.snapshot);
    } else if (res.error) {
      setStorageWarning(res.error);
    }
    return res.snapshot;
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, editId?: string) => {
    if (editId) {
      const prevTx = transactions.find((t) => t.id === editId);
      setTransactions((prev) =>
        prev.map((t) => (t.id === editId ? { ...txData, id: editId } : t))
      );

      const linkedSalaryId = txData.salaryRecordId || prevTx?.salaryRecordId;
      if (linkedSalaryId) {
        const shouldUnlink = txData.status === 'CANCELLED' || Boolean(txData.isInternalTransfer);
        setSalaryData((prev) => ({
          ...prev,
          records: prev.records.map((r) =>
            r.id === linkedSalaryId
              ? shouldUnlink
                ? { ...r, linkedTransactionId: undefined, updatedAt: new Date().toISOString() }
                : {
                    ...r,
                    amount: txData.amount,
                    paymentDate: txData.date,
                    manualNetOverride: true,
                    updatedAt: new Date().toISOString(),
                  }
              : r
          ),
        }));
      }
    } else {
      const tr: Transaction = {
        ...txData,
        id: 'tr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      };
      setTransactions((prev) => [tr, ...prev]);
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const idx = transactions.findIndex((t) => t.id === id);
    const removed = idx >= 0 ? transactions[idx] : null;
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (removed?.salaryRecordId) {
      const targetRecId = removed.salaryRecordId;
      setSalaryData((prev) => ({
        ...prev,
        records: prev.records.map((r) =>
          r.id === targetRecId ? { ...r, linkedTransactionId: undefined } : r
        ),
      }));
    }

    if (removed) {
      triggerUndo(`Lançamento "${removed.description}" excluído.`, () => {
        setTransactions((prev) => {
          if (prev.some((t) => t.id === removed.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
        if (removed.salaryRecordId) {
          setSalaryData((prev) => ({
            ...prev,
            records: prev.records.map((r) =>
              r.id === removed.salaryRecordId ? { ...r, linkedTransactionId: removed.id } : r
            ),
          }));
        }
      });
    }
  };

  const handleLinkSalaryToTransaction = (recordId: string, accountId: string) => {
    const rec = salaryData.records.find((r) => r.id === recordId);
    if (!rec || rec.amount === null || rec.amount <= 0) return;

    if (rec.linkedTransactionId && transactions.some((t) => t.id === rec.linkedTransactionId)) {
      setStorageWarning('Este registro salarial já está vinculado a uma transação bancária.');
      return;
    }

    const acc = derivedAccounts.find((a) => a.id === accountId && !a.archived);
    if (!acc) {
      setStorageWarning('Selecione uma conta bancária ativa para vincular o recebimento.');
      return;
    }

    const src = salaryData.sources.find((s) => s.id === rec.sourceId);
    const txId = `tr-sal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const monthLabel = MONTHS_PT_FULL[rec.month - 1] || String(rec.month);
    const txDate =
      rec.paymentDate || `${rec.year}-${String(rec.month).padStart(2, '0')}-05`;

    const newTx: Transaction = {
      id: txId,
      entityId: acc.entityId,
      accountId: acc.id,
      date: txDate,
      description: `Salário/Renda: ${src?.name || 'Fonte'} (${monthLabel}/${rec.year})`,
      category: 'Salário',
      account: `${acc.institutionName} · ${acc.accountName}`,
      amount: rec.amount,
      direction: 'INCOME',
      status: 'CONFIRMED',
      origin: 'MANUAL',
      isInternalTransfer: false,
      operationType: 'TED_DOC',
      counterparty: src?.name,
      externalId: `sal-${rec.id}`,
      salaryRecordId: rec.id,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setSalaryData((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        r.id === rec.id
          ? { ...r, linkedTransactionId: txId, updatedAt: new Date().toISOString() }
          : r
      ),
    }));
    setFeedbackBanner(`Recebimento de ${src?.name || 'salário'} lançado na conta ${acc.institutionName}.`);
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleImportTransactions = (items: Omit<Transaction, 'id'>[]) => {
    const created: Transaction[] = items.map((item, idx) => ({
      ...item,
      id: `tr-imp-${Date.now()}-${idx}`,
    }));
    setTransactions((prev) => [...created, ...prev]);
  };

  const handleAddBoleto = (bol: Boleto) => {
    setBoletos((prev) => [bol, ...prev]);
  };

  const handlePayBoleto = (id: string, accountId?: string, paidAmount?: number) => {
    const target = boletos.find((b) => b.id === id);
    if (!target) return;
    if (!accountId) {
      setStorageWarning('Selecione uma conta bancária ativa para registrar a baixa do boleto.');
      return;
    }

    const acc = derivedAccounts.find((a) => a.id === accountId && !a.archived);
    if (!acc) {
      setStorageWarning('A conta pagadora selecionada não está disponível.');
      return;
    }

    const resolvedPaidAmount =
      typeof paidAmount === 'number' && Number.isFinite(paidAmount) && paidAmount > 0
        ? paidAmount
        : target.valorOriginal;
    const payDate = todayLocal();

    setBoletos((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'PAID',
              paidAt: payDate,
              paidAmount: resolvedPaidAmount,
              paidAccountId: acc.id,
            }
          : b
      )
    );

    handleSaveTransaction({
      entityId: target.entityId,
      accountId: acc.id,
      date: payDate,
      description: `Pgto Boleto: ${target.beneficiario}`,
      category: target.category || 'Outros',
      account: `${acc.institutionName} · ${acc.accountName}`,
      amount: resolvedPaidAmount,
      direction: 'EXPENSE',
      status: 'CONFIRMED',
      origin: 'BOLETO',
      operationType: 'BOLETO',
      counterparty: target.beneficiario,
    });
  };

  const handleDeleteBoleto = (id: string) => {
    const idx = boletos.findIndex((b) => b.id === id);
    const removed = idx >= 0 ? boletos[idx] : null;
    setBoletos((prev) => prev.filter((b) => b.id !== id));
    if (removed) {
      triggerUndo(`Boleto "${removed.beneficiario}" removido.`, () => {
        setBoletos((prev) => {
          if (prev.some((b) => b.id === removed.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
      });
    }
  };

  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = { ...accData, id: 'acc-' + Date.now() };
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleDeleteAccount = (id: string) => {
    const idx = accounts.findIndex((a) => a.id === id);
    const target = idx >= 0 ? accounts[idx] : undefined;
    const check = canDeleteAccount(id, { transactions, boletos, account: target });
    if (!check.allowed) {
      setStorageWarning(
        check.reason ||
          'Não é possível excluir uma conta com lançamentos vinculados. Arquive a conta para preservar o histórico e saldos.'
      );
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (target) {
      triggerUndo(`Conta "${target.institutionName} · ${target.accountName}" excluída.`, () => {
        setAccounts((prev) => {
          if (prev.some((a) => a.id === target.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, target);
          return next;
        });
      });
    }
  };

  const handleToggleArchiveAccount = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, archived: !a.archived } : a))
    );
  };

  const handleAddCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = { ...cardData, id: 'card-' + Date.now() };
    setCreditCards((prev) => [...prev, newCard]);
  };

  const handlePayCardInvoice = (cardId: string, accountId?: string) => {
    const card = creditCards.find((c) => c.id === cardId);
    if (!card) return;

    const amountToPay = card.currentInvoiceAmount;
    setCreditCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, currentInvoiceAmount: 0, status: 'PAID' } : c))
    );

    if (accountId && amountToPay > 0) {
      const acc = derivedAccounts.find((a) => a.id === accountId);
      if (acc) {
        handleSaveTransaction({
          entityId: card.entityId,
          accountId: acc.id,
          date: todayLocal(),
          description: `Pgto Fatura: ${card.cardName}`,
          category: 'Cartão',
          account: `${acc.institutionName} · ${acc.accountName}`,
          amount: amountToPay,
          direction: 'EXPENSE',
          status: 'CONFIRMED',
          origin: 'MANUAL',
        });
      }
    }
  };

  const handleDeleteCard = (id: string) => {
    const idx = creditCards.findIndex((c) => c.id === id);
    const removed = idx >= 0 ? creditCards[idx] : null;
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
    if (removed) {
      triggerUndo(`Cartão "${removed.cardName}" removido.`, () => {
        setCreditCards((prev) => {
          if (prev.some((c) => c.id === removed.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
      });
    }
  };

  const handleAddDebt = (debtData: Omit<Debt, 'id'>) => {
    setDebts((prev) => [...prev, { ...debtData, id: 'debt-' + Date.now() }]);
  };

  const handleDeleteDebt = (id: string) => {
    const idx = debts.findIndex((d) => d.id === id);
    const removed = idx >= 0 ? debts[idx] : null;
    setDebts((prev) => prev.filter((d) => d.id !== id));
    if (removed) {
      triggerUndo(`Compromisso "${removed.creditorName}" removido.`, () => {
        setDebts((prev) => {
          if (prev.some((d) => d.id === removed.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
      });
    }
  };

  const handleAddAsset = (assetData: Omit<Asset, 'id'>) => {
    setAssets((prev) => [...prev, { ...assetData, id: 'ast-' + Date.now() }]);
  };

  const handleDeleteAsset = (id: string) => {
    const idx = assets.findIndex((a) => a.id === id);
    const removed = idx >= 0 ? assets[idx] : null;
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (removed) {
      triggerUndo(`Ativo "${removed.description}" removido.`, () => {
        setAssets((prev) => {
          if (prev.some((a) => a.id === removed.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
      });
    }
  };

  const handleAddDocument = (doc: DocumentItem) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleDeleteDocument = (id: string) => {
    const idx = documents.findIndex((d) => d.id === id);
    const removed = idx >= 0 ? documents[idx] : null;
    setDocuments((prev) => prev.filter((d) => d.id !== id));

    const timer = setTimeout(() => {
      void fileStorageService.deleteFile(id);
      docDeleteTimersRef.current.delete(id);
    }, 7500);
    docDeleteTimersRef.current.set(id, timer);

    if (removed) {
      triggerUndo(`Documento "${removed.name}" removido.`, () => {
        const pendingTimer = docDeleteTimersRef.current.get(id);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          docDeleteTimersRef.current.delete(id);
        }
        setDocuments((prev) => {
          if (prev.some((d) => d.id === removed.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        });
      });
    }
  };

  const handleImportBackup = (
    payload: FullBackupPayload,
    mode: 'replace' | 'merge'
  ): { ok: boolean; error?: string } => {
    const rollbackSnapshot = createSafetySnapshot(
      mode === 'replace' ? 'replace_import' : 'manual'
    );

    const currentDataset = {
      accounts,
      transactions,
      creditCards,
      boletos,
      debts,
      assets,
      documents,
      salaries: salaryData,
      settings: { theme, density, zoom },
    };

    try {
      const { next, addedTotal } = applyBackupDataset(currentDataset, payload.data, mode);
      const integrity = validateDatasetIntegrity(next);
      if (!integrity.ok) {
        const prevData = rollbackSnapshot.backup.data;
        setAccounts(prevData.accounts);
        setTransactions(prevData.transactions);
        setCreditCards(prevData.creditCards);
        setBoletos(prevData.boletos);
        setDebts(prevData.debts);
        setAssets(prevData.assets);
        setDocuments(prevData.documents);
        if (prevData.salaries) setSalaryData(prevData.salaries);
        return {
          ok: false,
          error: integrity.error || 'Falha de integridade após leitura do backup.',
        };
      }

      setAccounts(next.accounts);
      setTransactions(next.transactions);
      setCreditCards(next.creditCards);
      setBoletos(next.boletos);
      setDebts(next.debts);
      setAssets(next.assets);
      setDocuments(next.documents);
      if (next.salaries) setSalaryData(next.salaries);

      if (mode === 'replace' && next.settings) {
        if (next.settings.theme) setTheme(next.settings.theme);
        if (next.settings.density) setDensity(next.settings.density);
        if (next.settings.zoom) setZoom(next.settings.zoom);
      }

      setFeedbackBanner(
        mode === 'replace'
          ? 'Backup completo restaurado com snapshot de segurança salvo.'
          : `${addedTotal} registro(s) novo(s) importado(s) do backup.`
      );
      setTimeout(() => setFeedbackBanner(null), 5000);
      return { ok: true };
    } catch (err) {
      const prevData = rollbackSnapshot.backup.data;
      setAccounts(prevData.accounts);
      setTransactions(prevData.transactions);
      setCreditCards(prevData.creditCards);
      setBoletos(prevData.boletos);
      setDebts(prevData.debts);
      setAssets(prevData.assets);
      setDocuments(prevData.documents);
      if (prevData.salaries) setSalaryData(prevData.salaries);
      const msg = err instanceof Error ? err.message : 'Falha inesperada na importação do backup.';
      setStorageWarning(`Rollback acionado: ${msg}`);
      return { ok: false, error: msg };
    }
  };

  const handleRestoreSnapshot = () => {
    if (!preResetSnapshot) return;
    const snapData = preResetSnapshot.backup.data;
    setAccounts(snapData.accounts);
    setTransactions(snapData.transactions);
    setCreditCards(snapData.creditCards);
    setBoletos(snapData.boletos);
    setDebts(snapData.debts);
    setAssets(snapData.assets);
    setDocuments(snapData.documents);
    if (snapData.salaries) setSalaryData(snapData.salaries);
    if (snapData.settings) {
      if (snapData.settings.theme) setTheme(snapData.settings.theme);
      if (snapData.settings.density) setDensity(snapData.settings.density);
      if (snapData.settings.zoom) setZoom(snapData.settings.zoom);
    }
    setFeedbackBanner('Snapshot anterior restaurado com sucesso!');
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  const handleResetData = () => {
    createSafetySnapshot('reset');
    clearEntityStoragePreservingBackups();
    void fileStorageService.clearAllFiles();
    setTransactions(initialTransactions);
    setAccounts(initialAccounts);
    setCreditCards(initialCreditCards);
    setBoletos(initialBoletos);
    setDebts(initialDebts);
    setAssets(initialAssets);
    setDocuments(initialDocuments);
    setSalaryData(EMPTY_SALARY_DATASET);
    setFeedbackBanner(
      'Dados restaurados para o padrão inicial. Um snapshot automático dos seus dados anteriores foi preservado em Configurações.'
    );
    setTimeout(() => setFeedbackBanner(null), 6000);
  };

  const openNewModalForEntity = (entity: 'CPF' | 'CNPJ') => {
    setEditingTransaction(null);
    setDefaultModalEntity(entity);
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDefaultModalEntity(tx.entityId);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f3f5f8] dark:bg-[#0b1120] text-[#172536] dark:text-slate-100 font-sans">
      {/* Sidebar hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          scope={scope}
          setScope={setScope}
          period={period}
          setPeriod={setPeriod}
          periodOptions={periodOptions}
          onOpenNewTransaction={() => openNewModalForEntity(scope === 'CNPJ' ? 'CNPJ' : 'CPF')}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          boletos={boletos}
          onNavigate={setCurrentTab}
        />

        <main className="p-4 sm:p-8 max-w-[1600px] w-full mx-auto flex-1">
          {storageWarning && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
              <span>{storageWarning}</span>
              <button
                type="button"
                onClick={() => setStorageWarning(null)}
                className="px-3 min-h-8 rounded-lg bg-amber-200/70 dark:bg-amber-900 text-xs font-bold shrink-0 cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          )}

          {feedbackBanner && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold">
              {feedbackBanner}
            </div>
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              accounts={derivedAccounts}
              boletos={boletos}
              cards={creditCards}
              scope={scope}
              period={period}
              onNavigate={setCurrentTab}
              onOpenNew={() => openNewModalForEntity(scope === 'CNPJ' ? 'CNPJ' : 'CPF')}
              onEditTransaction={openEditModal}
            />
          )}

          {currentTab === 'cpf' && (
            <CpfView
              transactions={transactions}
              period={period}
              onAddTransaction={() => openNewModalForEntity('CPF')}
              onEditTransaction={openEditModal}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentTab === 'cnpj' && (
            <CnpjView
              transactions={transactions}
              boletos={boletos}
              period={period}
              onAddTransaction={() => openNewModalForEntity('CNPJ')}
              onEditTransaction={openEditModal}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'salary' && (
            <SalaryView
              dataset={salaryData}
              accounts={derivedAccounts}
              theme={theme}
              onUpdateDataset={setSalaryData}
              onBackupBeforeImport={() => backupSalaryBeforeImport()}
              onLinkSalaryToTransaction={handleLinkSalaryToTransaction}
              onNotifyUndo={triggerUndo}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsView
              accounts={derivedAccounts}
              transactions={transactions}
              boletos={boletos}
              onAddAccount={handleAddAccount}
              onDeleteAccount={handleDeleteAccount}
              onToggleArchiveAccount={handleToggleArchiveAccount}
            />
          )}

          {currentTab === 'cards' && (
            <CardsView
              cards={creditCards}
              accounts={derivedAccounts}
              onAddCard={handleAddCard}
              onPayCardInvoice={handlePayCardInvoice}
              onDeleteCard={handleDeleteCard}
            />
          )}

          {currentTab === 'boletos' && (
            <BoletosView
              boletos={boletos}
              accounts={derivedAccounts}
              onAddBoleto={handleAddBoleto}
              onPayBoleto={handlePayBoleto}
              onDeleteBoleto={handleDeleteBoleto}
            />
          )}

          {currentTab === 'debts' && (
            <DebtsView debts={debts} onAddDebt={handleAddDebt} onDeleteDebt={handleDeleteDebt} />
          )}

          {currentTab === 'planning' && (
            <PlanningView transactions={transactions} scope={scope} period={period} />
          )}

          {currentTab === 'investments' && (
            <InvestmentDashboard
              assets={assets}
              theme={theme}
              onNotifyUndo={triggerUndo}
            />
          )}

          {currentTab === 'assets' && (
            <AssetsView
              assets={assets}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentsView
              documents={documents}
              accounts={derivedAccounts}
              transactions={transactions}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              onAddTransactions={handleImportTransactions}
            />
          )}

          {currentTab === 'imports' && (
            <ImportsView
              accounts={derivedAccounts}
              transactions={transactions}
              onImportTransactions={handleImportTransactions}
            />
          )}

          {currentTab === 'ai' && (
            <AiAssistantView
              transactions={transactions}
              boletos={boletos}
              accounts={derivedAccounts}
              cards={creditCards}
              debts={debts}
              scope={scope}
              period={period}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              accounts={derivedAccounts}
              boletos={boletos}
              debts={debts}
              assets={assets}
              scope={scope}
              period={period}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              dataset={{
                accounts,
                transactions,
                creditCards,
                boletos,
                debts,
                assets,
                documents,
                salaries: salaryData,
                settings: { theme, density, zoom },
              }}
              transactions={transactions}
              boletos={boletos}
              preResetSnapshot={preResetSnapshot}
              onImportBackup={handleImportBackup}
              onRestoreSnapshot={handleRestoreSnapshot}
              onResetData={handleResetData}
              theme={theme}
              setTheme={setTheme}
              density={density}
              setDensity={setDensity}
              zoom={zoom}
              setZoom={setZoom}
            />
          )}
        </main>
      </div>

      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        scope={scope}
        onOpenNew={() => openNewModalForEntity(scope === 'CNPJ' ? 'CNPJ' : 'CPF')}
      />

      <OfflineIndicator />

      {pendingUndo && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] md:bottom-5 right-4 left-4 md:left-auto z-50 md:max-w-md bg-[#14263d] dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700 px-4 py-3 flex items-center justify-between gap-3"
        >
          <span className="text-xs sm:text-sm font-medium truncate">{pendingUndo.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={executeUndo}
              className="px-3 min-h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={13} /> Desfazer
            </button>
            <button
              type="button"
              onClick={() => setPendingUndo(null)}
              aria-label="Fechar aviso"
              className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        accounts={derivedAccounts}
        defaultEntity={defaultModalEntity}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
