import { describe, it, expect } from 'vitest';
import { calculateAccountBalances, filterTransactionsByPeriod, checkDuplicateTransaction, calculateBudget503020 } from '../financeCalculations';
import { validateAndParseBoleto } from '../boletoValidator';
import { sanitizeCellForSheet } from '../sheetGuard';
import { Transaction, Account } from '../../types';

describe('FINANCE IA - Unit Tests (Phase 0 & Rule 7)', () => {
  it('calculates derived account balances correctly', () => {
    const accounts: Account[] = [
      { id: 'acc-1', entityId: 'CPF', institutionName: 'Banco Inter', accountName: 'Conta Principal', accountType: 'checking', balance: 0, openingBalance: 1000 }
    ];
    const transactions: Transaction[] = [
      { id: 'tr-1', entityId: 'CPF', date: '2026-11-05', description: 'Salário', category: 'Salário', account: 'Banco Inter', amount: 4200, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' },
      { id: 'tr-2', entityId: 'CPF', date: '2026-11-10', description: 'Aluguel', category: 'Moradia', account: 'Banco Inter', amount: 600, direction: 'EXPENSE', status: 'CONFIRMED', origin: 'MANUAL' }
    ];

    const updated = calculateAccountBalances(accounts, transactions);
    // 1000 opening + 4200 income - 600 expense = 4600
    expect(updated[0].balance).toBe(4600);
  });

  it('filters transactions by period (YYYY-MM)', () => {
    const transactions: Transaction[] = [
      { id: '1', entityId: 'CPF', date: '2026-11-05', description: 'A', category: 'A', account: 'A', amount: 100, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' },
      { id: '2', entityId: 'CPF', date: '2026-10-15', description: 'B', category: 'B', account: 'A', amount: 200, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' }
    ];

    const filteredNov = filterTransactionsByPeriod(transactions, '2026-11');
    expect(filteredNov.length).toBe(1);
    expect(filteredNov[0].id).toBe('1');
  });

  it('calculates 50/30/20 budget correctly based on real income', () => {
    const incomeTrs: Transaction[] = [
      { id: '1', entityId: 'CPF', date: '2026-11-05', description: 'Salário', category: 'Salário', account: 'A', amount: 10000, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' }
    ];

    const budget = calculateBudget503020(incomeTrs);
    expect(budget.realIncome).toBe(10000);
    expect(budget.needs).toBe(5000);
    expect(budget.wants).toBe(3000);
    expect(budget.savings).toBe(2000);
  });

  it('detects duplicate transactions (deduplication)', () => {
    const existing: Transaction[] = [
      { id: '1', entityId: 'CPF', date: '2026-11-05', description: 'Energia', category: 'Moradia', account: 'A', amount: 150, direction: 'EXPENSE', status: 'CONFIRMED', origin: 'MANUAL' }
    ];

    const isDup = checkDuplicateTransaction(existing, { date: '2026-11-05', amount: 150, description: 'Energia' });
    expect(isDup).toBe(true);

    const isNotDup = checkDuplicateTransaction(existing, { date: '2026-11-06', amount: 150, description: 'Energia' });
    expect(isNotDup).toBe(false);
  });

  it('validates boleto linha digitável', () => {
    const valid = validateAndParseBoleto('23793381286000012345678901234567189120000015000');
    expect(valid.isValid).toBe(true);
    expect(valid.amount).toBe(150.00);

    const invalid = validateAndParseBoleto('abc');
    expect(invalid.isValid).toBe(false);
  });

  it('prevents spreadsheet formula injection in sheetGuard', () => {
    expect(sanitizeCellForSheet('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCellForSheet('Normal Text')).toBe('Normal Text');
    expect(sanitizeCellForSheet(1500)).toBe(1500);
  });
});
