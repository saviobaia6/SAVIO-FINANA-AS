import { Transaction, Account, OperationType } from '../types';

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function parseCurrencyInput(raw: string): number {
  const cleaned = raw.trim().replace(/\s+/g, '');
  if (!cleaned) return NaN;
  // Support Brazilian format "1.234,56" or "1234,56" and standard "1234.56"
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    return fromCents(Math.round(Number(normalized) * 100));
  }
  return fromCents(Math.round(Number(cleaned) * 100));
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calculateAccountBalances(accounts: Account[], transactions: Transaction[]): Account[] {
  return accounts.map((acc) => {
    const accTransactions = transactions.filter(
      (t) => t.accountId === acc.id && t.status !== 'CANCELLED'
    );

    const sumCents = accTransactions.reduce((accSum, t) => {
      const cents = toCents(t.amount);
      return accSum + (t.direction === 'INCOME' ? cents : -cents);
    }, 0);

    const openingCents = toCents(acc.openingBalance ?? 0);
    return {
      ...acc,
      balance: fromCents(openingCents + sumCents),
    };
  });
}

export function filterTransactionsByPeriod(transactions: Transaction[], period: string): Transaction[] {
  // period format: 'YYYY-MM', 'YYYY', or 'ALL'
  if (!period || period === 'ALL') return transactions;
  return transactions.filter((t) => t.date.startsWith(period));
}

export function calculateBudget503020(transactions: Transaction[]) {
  const realIncomeCents = transactions
    .filter((t) => t.direction === 'INCOME' && t.status !== 'CANCELLED' && !t.isInternalTransfer)
    .reduce((acc, t) => acc + toCents(t.amount), 0);

  const realIncome = fromCents(realIncomeCents);
  return {
    realIncome,
    needs: fromCents(Math.round(realIncomeCents * 0.5)),
    wants: fromCents(Math.round(realIncomeCents * 0.3)),
    savings: fromCents(Math.round(realIncomeCents * 0.2)),
  };
}

export function normalizeDescription(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function checkDuplicateTransaction(
  existingTransactions: Transaction[],
  newTr: { date: string; amount: number; description: string; externalId?: string }
): boolean {
  const newExtId = newTr.externalId ? newTr.externalId.trim().toLowerCase() : '';
  if (newExtId) {
    const idMatch = existingTransactions.some(
      (t) =>
        t.status !== 'CANCELLED' &&
        Boolean(t.externalId) &&
        t.externalId!.trim().toLowerCase() === newExtId
    );
    if (idMatch) return true;
  }

  const newNorm = normalizeDescription(newTr.description);
  const newCents = toCents(newTr.amount);
  return existingTransactions.some(
    (t) =>
      t.status !== 'CANCELLED' &&
      t.date === newTr.date &&
      toCents(t.amount) === newCents &&
      normalizeDescription(t.description) === newNorm
  );
}

export function detectInternalTransfer(
  item: {
    operationType?: OperationType;
    isInternalTransfer?: boolean;
    counterparty?: string;
    description?: string;
    originAccountHint?: string;
    destinationAccountHint?: string;
  },
  accounts: Account[]
): boolean {
  if (item.isInternalTransfer || item.operationType === 'TRANSFERENCIA_PROPRIA') {
    return true;
  }

  const knownKeywords = accounts
    .flatMap((a) => [a.institutionName, a.accountName])
    .map(normalizeDescription)
    .filter((k) => k.length >= 4);

  const originNorm = normalizeDescription(item.originAccountHint || '');
  const destNorm = normalizeDescription(item.destinationAccountHint || '');

  if (originNorm && destNorm) {
    const originMatches = knownKeywords.some((k) => originNorm.includes(k));
    const destMatches = knownKeywords.some((k) => destNorm.includes(k));
    if (originMatches && destMatches) return true;
  }

  const combined = normalizeDescription(`${item.description || ''} ${item.counterparty || ''}`);
  if (
    combined.includes('mesma titularidade') ||
    combined.includes('entre contas proprias') ||
    combined.includes('transferencia propria')
  ) {
    return true;
  }

  return false;
}
