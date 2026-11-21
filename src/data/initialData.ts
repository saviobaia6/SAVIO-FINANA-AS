import { Transaction, Account, CreditCard, Boleto, Debt, Asset, DocumentItem } from '../types';

export const initialAccounts: Account[] = [
  { id: 'acc-1', entityId: 'CPF', institutionName: 'Banco Inter', accountName: 'Conta Corrente Principal', accountType: 'checking', openingBalance: 1940.00, balance: 5420.00 },
  { id: 'acc-2', entityId: 'CPF', institutionName: 'RecargaPay', accountName: 'Conta Digital', accountType: 'checking', openingBalance: 800.00, balance: 1250.00 },
  { id: 'acc-3', entityId: 'CNPJ', institutionName: 'Nubank Empresa', accountName: 'Conta PJ MEI', accountType: 'business', openingBalance: 2690.00, balance: 3850.00 },
  { id: 'acc-4', entityId: 'CPF', institutionName: 'Banco do Brasil', accountName: 'Conta Híbrida', accountType: 'checking', openingBalance: 2100.00, balance: 2100.00 },
  { id: 'acc-5', entityId: 'CPF', institutionName: 'Rico', accountName: 'Investimentos', accountType: 'investment', openingBalance: 12400.00, balance: 12400.00 }
];

export const initialTransactions: Transaction[] = [
  {
    id: 'tr-1',
    entityId: 'CPF',
    accountId: 'acc-1',
    date: '2026-11-05',
    description: 'Remuneração Câmara',
    category: 'Salário',
    account: 'Banco Inter · Conta Corrente Principal',
    amount: 4200.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-2',
    entityId: 'CPF',
    accountId: 'acc-2',
    date: '2026-11-08',
    description: 'Pagamento UNIP',
    category: 'Salário',
    account: 'RecargaPay · Conta Digital',
    amount: 450.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-3',
    entityId: 'CPF',
    accountId: 'acc-1',
    date: '2026-11-10',
    description: 'Aluguel residencial',
    category: 'Moradia',
    account: 'Banco Inter · Conta Corrente Principal',
    amount: 600.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-4',
    entityId: 'CPF',
    accountId: 'acc-1',
    date: '2026-11-12',
    description: 'Mercado e alimentação',
    category: 'Alimentação',
    account: 'Banco Inter · Conta Corrente Principal',
    amount: 520.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-5',
    entityId: 'CNPJ',
    accountId: 'acc-3',
    date: '2026-11-06',
    description: 'Venda de copos personalizados',
    category: 'Serviço MEI',
    account: 'Nubank Empresa · Conta PJ MEI',
    amount: 1500.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-6',
    entityId: 'CNPJ',
    accountId: 'acc-3',
    date: '2026-11-14',
    description: 'Impressão e insumos gráficos',
    category: 'Insumos / Produção',
    account: 'Nubank Empresa · Conta PJ MEI',
    amount: 340.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-7',
    entityId: 'CPF',
    accountId: 'acc-1',
    date: '2026-11-18',
    description: 'Fatura de cartão Inter',
    category: 'Cartão',
    account: 'Banco Inter · Conta Corrente Principal',
    amount: 1120.00,
    direction: 'EXPENSE',
    status: 'PENDING',
    origin: 'MANUAL'
  },
  {
    id: 'tr-8',
    entityId: 'CPF',
    accountId: 'acc-1',
    date: '2026-11-20',
    description: 'Internet residencial',
    category: 'Moradia',
    account: 'Banco Inter · Conta Corrente Principal',
    amount: 120.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-9',
    entityId: 'CPF',
    accountId: 'acc-1',
    date: '2026-10-05',
    description: 'Remuneração Câmara (Outubro)',
    category: 'Salário',
    account: 'Banco Inter · Conta Corrente Principal',
    amount: 4200.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-10',
    entityId: 'CPF',
    accountId: 'acc-1',
    date: '2026-10-10',
    description: 'Aluguel residencial (Outubro)',
    category: 'Moradia',
    account: 'Banco Inter · Conta Corrente Principal',
    amount: 600.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-11',
    entityId: 'CNPJ',
    accountId: 'acc-3',
    date: '2026-10-18',
    description: 'Serviços gráficos sob encomenda',
    category: 'Serviço MEI',
    account: 'Nubank Empresa · Conta PJ MEI',
    amount: 950.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  }
];

export const initialCreditCards: CreditCard[] = [
  { id: 'card-1', entityId: 'CPF', institutionName: 'Inter', cardName: 'Inter Mastercard Black', last4: '4821', limit: 8000.00, closingDay: 18, dueDay: 25, currentInvoiceAmount: 1120.00, status: 'OPEN' },
  { id: 'card-2', entityId: 'CPF', institutionName: 'Nubank', cardName: 'Nu Ultravioleta', last4: '9310', limit: 12000.00, closingDay: 10, dueDay: 17, currentInvoiceAmount: 890.00, status: 'OPEN' },
  { id: 'card-3', entityId: 'CNPJ', institutionName: 'Nubank Empresa', cardName: 'Cartão PJ', last4: '1044', limit: 5000.00, closingDay: 15, dueDay: 22, currentInvoiceAmount: 400.00, status: 'OPEN' }
];

export const initialBoletos: Boleto[] = [
  { id: 'bol-1', beneficiario: 'Enel Distribuição', pagador: 'Titular CPF', instituicao: 'Banco Inter', linhaDigitavel: '23793381286000012345678901234567189120000021000', vencimento: '2026-11-23', valorOriginal: 210.00, descricao: 'Energia elétrica residencial', status: 'PENDING', entityId: 'CPF', category: 'Moradia' },
  { id: 'bol-2', beneficiario: 'Prefeitura Municipal (DAS MEI)', pagador: 'CNPJ MEI', instituicao: 'Receita Federal', linhaDigitavel: '82670000005065000213000189123456789200000007590', vencimento: '2026-11-20', valorOriginal: 75.90, descricao: 'DAS MEI - Simples Nacional', status: 'PENDING', entityId: 'CNPJ', category: 'Impostos / DAS' },
  { id: 'bol-3', beneficiario: 'Condomínio Edifício Executivo', pagador: 'Titular CPF', instituicao: 'Itaú', linhaDigitavel: '34191790010104351001991020150008389120000065000', vencimento: '2026-11-28', valorOriginal: 650.00, descricao: 'Taxa condominial', status: 'PENDING', entityId: 'CPF', category: 'Moradia' }
];

export const initialDebts: Debt[] = [
  { id: 'debt-1', entityId: 'CPF', creditorName: 'Financiamento Equipamentos', description: 'Aquisição de notebook de trabalho', originalAmount: 4500.00, outstandingAmount: 1800.00, installmentAmount: 450.00, dueDay: 10, status: 'ACTIVE' }
];

export const initialAssets: Asset[] = [
  { id: 'ast-1', entityId: 'CPF', assetType: 'Reserva', institutionName: 'Banco Inter', description: 'Reserva de emergência liquidez diária', currentValue: 15000.00, valuationDate: '2026-11-01' },
  { id: 'ast-2', entityId: 'CPF', assetType: 'Renda Fixa', institutionName: 'Rico', description: 'CDB 110% CDI', currentValue: 12400.00, valuationDate: '2026-11-01' },
  { id: 'ast-3', entityId: 'CNPJ', assetType: 'Produtos Boticário', institutionName: 'Estoque', description: 'Produtos Boticário e insumos gráficos', currentValue: 4200.00, valuationDate: '2026-11-01' }
];

export const initialDocuments: DocumentItem[] = [];
