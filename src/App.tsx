import React, { useState, useEffect } from 'react';
import { EntityScope, Transaction, Boleto, DocumentItem, Account } from './types';
import { 
  initialTransactions, 
  initialAccounts, 
  initialCreditCards, 
  initialBoletos, 
  initialDebts, 
  initialAssets, 
  initialDocuments 
} from './data/initialData';

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

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [scope, setScope] = useState<EntityScope>('CONSOLIDATED');
  const [period, setPeriod] = useState('11/2026');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultModalEntity, setDefaultModalEntity] = useState<'CPF' | 'CNPJ'>('CPF');

  // Persistent State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_ia_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('finance_ia_accounts');
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [creditCards] = useState(() => {
    const saved = localStorage.getItem('finance_ia_cards');
    return saved ? JSON.parse(saved) : initialCreditCards;
  });

  const [boletos, setBoletos] = useState<Boleto[]>(() => {
    const saved = localStorage.getItem('finance_ia_boletos');
    return saved ? JSON.parse(saved) : initialBoletos;
  });

  const [debts] = useState(() => {
    const saved = localStorage.getItem('finance_ia_debts');
    return saved ? JSON.parse(saved) : initialDebts;
  });

  const [assets] = useState(() => {
    const saved = localStorage.getItem('finance_ia_assets');
    return saved ? JSON.parse(saved) : initialAssets;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('finance_ia_docs');
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  useEffect(() => {
    localStorage.setItem('finance_ia_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_ia_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('finance_ia_boletos', JSON.stringify(boletos));
  }, [boletos]);

  useEffect(() => {
    localStorage.setItem('finance_ia_docs', JSON.stringify(documents));
  }, [documents]);

  const handleAddTransaction = (newTr: Omit<Transaction, 'id'>) => {
    const tr: Transaction = {
      ...newTr,
      id: 'tr-' + Date.now()
    };
    setTransactions((prev: Transaction[]) => [tr, ...prev]);

    // Update account balance
    setAccounts((prev: Account[]) => prev.map((acc: Account) => {
      if (acc.accountName.toLowerCase().includes(tr.account.toLowerCase()) || acc.institutionName.toLowerCase().includes(tr.account.toLowerCase())) {
        const delta = tr.direction === 'INCOME' ? tr.amount : -tr.amount;
        return { ...acc, balance: acc.balance + delta };
      }
      return acc;
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev: Transaction[]) => prev.filter(t => t.id !== id));
  };

  const handleAddBoleto = (bol: Boleto) => {
    setBoletos((prev: Boleto[]) => [bol, ...prev]);
  };

  const handlePayBoleto = (id: string) => {
    setBoletos((prev: Boleto[]) => prev.map(b => b.id === id ? { ...b, status: 'PAID' } : b));
  };

  const handleAddDocument = (doc: DocumentItem) => {
    setDocuments((prev: DocumentItem[]) => [doc, ...prev]);
  };

  const handleResetData = () => {
    setTransactions(initialTransactions);
    setAccounts(initialAccounts);
    setBoletos(initialBoletos);
    setDocuments(initialDocuments);
    localStorage.clear();
    alert('Dados restaurados para o padrão inicial com sucesso.');
  };

  const openNewModalForEntity = (entity: 'CPF' | 'CNPJ') => {
    setDefaultModalEntity(entity);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f3f5f8] text-[#172536] font-sans pb-16 md:pb-0">
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
        />

        <main className="p-4 sm:p-8 max-w-[1600px] w-full mx-auto flex-1">
          {currentTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              boletos={boletos}
              scope={scope}
              period={period}
              onNavigate={setCurrentTab}
              onOpenNew={() => openNewModalForEntity('CPF')}
            />
          )}

          {currentTab === 'cpf' && (
            <CpfView
              transactions={transactions}
              onAddTransaction={() => openNewModalForEntity('CPF')}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentTab === 'cnpj' && (
            <CnpjView
              transactions={transactions}
              onAddTransaction={() => openNewModalForEntity('CNPJ')}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsView accounts={accounts} />
          )}

          {currentTab === 'cards' && (
            <CardsView cards={creditCards} />
          )}

          {currentTab === 'boletos' && (
            <BoletosView
              boletos={boletos}
              onAddBoleto={handleAddBoleto}
              onPayBoleto={handlePayBoleto}
            />
          )}

          {currentTab === 'debts' && (
            <DebtsView debts={debts} />
          )}

          {currentTab === 'planning' && (
            <PlanningView />
          )}

          {currentTab === 'assets' && (
            <AssetsView assets={assets} />
          )}

          {currentTab === 'documents' && (
            <DocumentsView
              documents={documents}
              onAddDocument={handleAddDocument}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {currentTab === 'imports' && (
            <ImportsView />
          )}

          {currentTab === 'ai' && (
            <AiAssistantView
              transactions={transactions}
              boletos={boletos}
              accounts={accounts}
              debts={debts}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              transactions={transactions}
              boletos={boletos}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNew={() => openNewModalForEntity('CPF')}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
        defaultEntity={defaultModalEntity}
      />
    </div>
  );
}
