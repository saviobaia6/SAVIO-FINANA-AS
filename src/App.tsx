import React, { useState, useEffect, useMemo } from 'react';
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

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [scope, setScope] = useState<EntityScope>('CONSOLIDATED');
  const [period, setPeriod] = useState('2026-11');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultModalEntity, setDefaultModalEntity] = useState<'CPF' | 'CNPJ'>('CPF');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Ergonomics & Theme state synced at root
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finance_ia_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [density, setDensity] = useState<'compact' | 'standard' | 'enlarged'>(() => {
    const saved = localStorage.getItem('finance_ia_density');
    return saved === 'compact' || saved === 'enlarged' ? saved : 'standard';
  });

  const [zoom, setZoom] = useState<string>(() => {
    return localStorage.getItem('finance_ia_zoom') || '100%';
  });

  useEffect(() => {
    localStorage.setItem('finance_ia_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('finance_ia_density', density);
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem('finance_ia_zoom', zoom);
    document.documentElement.style.fontSize = zoom;
  }, [zoom]);

  // Persistent Entities State with safe migration defaults
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const loaded = loadJson<Account[]>('finance_ia_accounts', initialAccounts);
    return loaded.map((a) => ({
      ...a,
      openingBalance: typeof a.openingBalance === 'number' ? a.openingBalance : a.balance ?? 0,
    }));
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const loaded = loadJson<Transaction[]>('finance_ia_transactions', initialTransactions);
    const fallbackAccounts = loadJson<Account[]>('finance_ia_accounts', initialAccounts);
    return loaded.map((t) => {
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

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() =>
    loadJson<CreditCard[]>('finance_ia_cards', initialCreditCards)
  );

  const [boletos, setBoletos] = useState<Boleto[]>(() =>
    loadJson<Boleto[]>('finance_ia_boletos', initialBoletos)
  );

  const [debts, setDebts] = useState<Debt[]>(() =>
    loadJson<Debt[]>('finance_ia_debts', initialDebts)
  );

  const [assets, setAssets] = useState<Asset[]>(() =>
    loadJson<Asset[]>('finance_ia_assets', initialAssets)
  );

  const [documents, setDocuments] = useState<DocumentItem[]>(() =>
    loadJson<DocumentItem[]>('finance_ia_docs', initialDocuments)
  );

  // Derived account balances: openingBalance + sum(transactions by accountId)
  const derivedAccounts = useMemo(
    () => calculateAccountBalances(accounts, transactions),
    [accounts, transactions]
  );

  useEffect(() => {
    localStorage.setItem('finance_ia_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_ia_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('finance_ia_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('finance_ia_boletos', JSON.stringify(boletos));
  }, [boletos]);

  useEffect(() => {
    localStorage.setItem('finance_ia_debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('finance_ia_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('finance_ia_docs', JSON.stringify(documents));
  }, [documents]);

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, editId?: string) => {
    if (editId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editId ? { ...txData, id: editId } : t))
      );
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
    setTransactions((prev) => prev.filter((t) => t.id !== id));
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

  const handlePayBoleto = (id: string, accountId?: string) => {
    const target = boletos.find((b) => b.id === id);
    if (!target) return;

    setBoletos((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: 'PAID', paidAt: new Date().toISOString().split('T')[0] } : b
      )
    );

    if (accountId) {
      const acc = derivedAccounts.find((a) => a.id === accountId);
      if (acc) {
        handleSaveTransaction({
          entityId: target.entityId,
          accountId: acc.id,
          date: new Date().toISOString().split('T')[0],
          description: `Pgto Boleto: ${target.beneficiario}`,
          category: target.category || 'Outros',
          account: `${acc.institutionName} · ${acc.accountName}`,
          amount: target.valorOriginal,
          direction: 'EXPENSE',
          status: 'CONFIRMED',
          origin: 'BOLETO',
        });
      }
    }
  };

  const handleDeleteBoleto = (id: string) => {
    setBoletos((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = { ...accData, id: 'acc-' + Date.now() };
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
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
          date: new Date().toISOString().split('T')[0],
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
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddDebt = (debtData: Omit<Debt, 'id'>) => {
    setDebts((prev) => [...prev, { ...debtData, id: 'debt-' + Date.now() }]);
  };

  const handleDeleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddAsset = (assetData: Omit<Asset, 'id'>) => {
    setAssets((prev) => [...prev, { ...assetData, id: 'ast-' + Date.now() }]);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddDocument = (doc: DocumentItem) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleResetData = () => {
    localStorage.clear();
    setTransactions(initialTransactions);
    setAccounts(initialAccounts);
    setCreditCards(initialCreditCards);
    setBoletos(initialBoletos);
    setDebts(initialDebts);
    setAssets(initialAssets);
    setDocuments(initialDocuments);
    setFeedbackBanner('Dados restaurados para o padrão inicial com sucesso.');
    setTimeout(() => setFeedbackBanner(null), 5000);
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
          onOpenNewTransaction={() => openNewModalForEntity(scope === 'CNPJ' ? 'CNPJ' : 'CPF')}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          boletos={boletos}
          onNavigate={setCurrentTab}
        />

        <main className="p-4 sm:p-8 max-w-[1600px] w-full mx-auto flex-1">
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

          {currentTab === 'accounts' && (
            <AccountsView
              accounts={derivedAccounts}
              onAddAccount={handleAddAccount}
              onDeleteAccount={handleDeleteAccount}
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
              onAddDocument={handleAddDocument}
              onAddTransaction={(tx) => handleSaveTransaction(tx)}
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
              transactions={transactions}
              boletos={boletos}
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
        onOpenNew={() => openNewModalForEntity(scope === 'CNPJ' ? 'CNPJ' : 'CPF')}
      />

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
