import { Transaction, Account, CreditCard, Boleto, Debt, Asset, DocumentItem } from '../types';

export const initialTransactions: Transaction[] = [
  {
    id: 'tr-1',
    entityId: 'CPF',
    date: '2026-11-05',
    description: 'Remuneração Câmara',
    category: 'Salário',
    account: 'Banco principal',
    amount: 4200.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-2',
    entityId: 'CPF',
    date: '2026-11-08',
    description: 'Pagamento UNIP',
    category: 'Salário',
    account: 'Conta pessoal',
    amount: 450.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-3',
    entityId: 'CPF',
    date: '2026-11-10',
    description: 'Aluguel residencial',
    category: 'Moradia',
    account: 'Banco principal',
    amount: 600.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-4',
    entityId: 'CPF',
    date: '2026-11-12',
    description: 'Mercado e alimentação',
    category: 'Alimentação',
    account: 'Cartão Inter',
    amount: 520.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-5',
    entityId: 'CNPJ',
    date: '2026-11-06',
    description: 'Venda de copos personalizados',
    category: 'Serviço MEI',
    account: 'Nubank Empresa',
    amount: 1500.00,
    direction: 'INCOME',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-6',
    entityId: 'CNPJ',
    date: '2026-11-14',
    description: 'Impressão e insumos gráficos',
    category: 'Insumos / Produção',
    account: 'Nubank Empresa',
    amount: 340.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  },
  {
    id: 'tr-7',
    entityId: 'CPF',
    date: '2026-11-18',
    description: 'Fatura de cartão Inter',
    category: 'Cartão',
    account: 'Inter',
    amount: 1120.00,
    direction: 'EXPENSE',
    status: 'PENDING',
    origin: 'MANUAL'
  },
  {
    id: 'tr-8',
    entityId: 'CPF',
    date: '2026-11-20',
    description: 'Internet residencial',
    category: 'Moradia',
    account: 'Banco principal',
    amount: 120.00,
    direction: 'EXPENSE',
    status: 'CONFIRMED',
    origin: 'MANUAL'
  }
];

export const initialAccounts: Account[] = [
  { id: 'acc-1', entityId: 'CPF', institutionName: 'Banco Inter', accountName: 'Conta Corrente Principal', accountType: 'checking', balance: 5420.00 },
  { id: 'acc-2', entityId: 'CPF', institutionName: 'RecargaPay', accountName: 'Conta Digital', accountType: 'checking', balance: 1250.00 },
  { id: 'acc-3', entityId: 'CNPJ', institutionName: 'Nubank Empresa', accountName: 'Conta PJ MEI', accountType: 'business', balance: 3850.00 },
  { id: 'acc-4', entityId: 'CPF', institutionName: 'Banco do Brasil', accountName: 'Conta Híbrida', accountType: 'checking', balance: 2100.00 },
  { id: 'acc-5', entityId: 'CPF', institutionName: 'Rico', accountName: 'Investimentos', accountType: 'investment', balance: 12400.00 }
];

export const initialCreditCards: CreditCard[] = [
  { id: 'card-1', entityId: 'CPF', institutionName: 'Inter', cardName: 'Inter Mastercard Black', last4: '4821', limit: 8000.00, closingDay: 18, dueDay: 25, currentInvoiceAmount: 1120.00, status: 'OPEN' },
  { id: 'card-2', entityId: 'CPF', institutionName: 'Nubank', cardName: 'Nu Ultravioleta', last4: '9310', limit: 12000.00, closingDay: 10, dueDay: 17, currentInvoiceAmount: 890.00, status: 'OPEN' },
  { id: 'card-3', entityId: 'CNPJ', institutionName: 'Nubank Empresa', cardName: 'Cartão PJ', last4: '1044', limit: 5000.00, closingDay: 15, dueDay: 22, currentInvoiceAmount: 400.00, status: 'OPEN' }
];

export const initialBoletos: Boleto[] = [
  { id: 'bol-1', beneficiario: 'Enel Distribuição', pagador: 'Titular CPF', instituicao: 'Banco Inter', linhaDigitavel: '23793.38128 60000.123456 78901.234567 1 89120000021000', vencimento: '2026-11-26', valorOriginal: 210.00, descricao: 'Energia elétrica residencial', status: 'PENDING', entityId: 'CPF', category: 'Moradia' },
  { id: 'bol-2', beneficiario: 'Prefeitura Municipal (DAS MEI)', pagador: 'CNPJ MEI', instituicao: 'Receita Federal', linhaDigitavel: '82670000005 0 65000213000 1 89123456789 2', vencimento: '2026-11-20', valorOriginal: 75.90, descricao: 'DAS MEI - Simples Nacional', status: 'PENDING', entityId: 'CNPJ', category: 'Impostos / DAS' },
  { id: 'bol-3', beneficiario: 'Condomínio Edifício Executivo', pagador: 'Titular CPF', instituicao: 'Itaú', linhaDigitavel: '34191.79001 01043.510019 91020.150008 3 89120000065000', vencimento: '2026-11-28', valorOriginal: 650.00, descricao: 'Taxa condominial', status: 'PENDING', entityId: 'CPF', category: 'Moradia' }
];

export const initialDebts: Debt[] = [
  { id: 'debt-1', entityId: 'CPF', creditorName: 'Financiamento Equipamentos', description: 'Aquisição de notebook de trabalho', originalAmount: 4500.00, outstandingAmount: 1800.00, installmentAmount: 450.00, dueDay: 10, status: 'ACTIVE' }
];

export const initialAssets: Asset[] = [
  { id: 'ast-1', entityId: 'CPF', assetType: 'Reserva', institutionName: 'Banco Inter', description: 'Reserva de emergência liquidez diária', currentValue: 15000.00, valuationDate: '2026-11-01' },
  { id: 'ast-2', entityId: 'CPF', assetType: 'Renda Fixa', institutionName: 'Rico', description: 'CDB 110% CDI', currentValue: 12400.00, valuationDate: '2026-11-01' },
  { id: 'ast-3', entityId: 'CNPJ', assetType: 'Produtos Boticário', institutionName: 'Estoque', description: 'Produtos Boticário e insumos gráficos', currentValue: 4200.00, valuationDate: '2026-11-01' }
];

export const initialDocuments: DocumentItem[] = [
  { id: 'doc-1', name: 'Extrato_Inter_Outubro.pdf', type: 'PDF', date: '01/11/2026', size: '245 KB', status: 'PROCESSED', extractedData: { description: 'Extrato Bancário', amount: 4200, category: 'Salário' } },
  { id: 'doc-2', name: 'Comprovante_DAS_MEI.pdf', type: 'PDF', date: '10/11/2026', size: '112 KB', status: 'PROCESSED', extractedData: { description: 'DAS MEI', amount: 75.90, category: 'Impostos / DAS' } }
];
