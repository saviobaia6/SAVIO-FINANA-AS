export type EntityScope = 'CPF' | 'CNPJ' | 'CONSOLIDATED';
export type Direction = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PLANNED' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type TransactionOrigin = 'MANUAL' | 'IMPORT' | 'OPEN_FINANCE' | 'BOLETO';

export interface Transaction {
  id: string;
  entityId: 'CPF' | 'CNPJ';
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  account: string;
  amount: number;
  direction: Direction;
  status: TransactionStatus;
  origin: TransactionOrigin;
}

export interface Account {
  id: string;
  entityId: 'CPF' | 'CNPJ';
  institutionName: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'business' | 'investment';
  balance: number;
  openingBalance?: number;
}

export interface CreditCard {
  id: string;
  entityId: 'CPF' | 'CNPJ';
  institutionName: string;
  cardName: string;
  last4: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentInvoiceAmount: number;
  status: 'OPEN' | 'CLOSED' | 'PAID';
}

export interface Boleto {
  id: string;
  beneficiario: string;
  pagador: string;
  instituicao: string;
  linhaDigitavel: string;
  vencimento: string;
  valorOriginal: number;
  descricao: string;
  status: 'PENDING' | 'PAID';
  entityId: 'CPF' | 'CNPJ';
  category: string;
}

export interface Debt {
  id: string;
  entityId: 'CPF' | 'CNPJ';
  creditorName: string;
  description: string;
  originalAmount: number;
  outstandingAmount: number;
  installmentAmount?: number;
  dueDay: number;
  status: 'ACTIVE' | 'PAID' | 'RENEGOTIATED';
}

export interface Asset {
  id: string;
  entityId: 'CPF' | 'CNPJ';
  assetType: 'Reserva' | 'Renda Fixa' | 'Renda Variável' | 'Fundos' | 'Produtos Boticário' | 'Outros';
  institutionName: string;
  description: string;
  currentValue: number;
  valuationDate: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  status: 'PENDING' | 'PROCESSED';
  extractedData?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
