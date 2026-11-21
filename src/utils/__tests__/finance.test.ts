import { describe, it, expect } from 'vitest';
import {
  calculateAccountBalances,
  filterTransactionsByPeriod,
  checkDuplicateTransaction,
  calculateBudget503020,
  parseCurrencyInput,
  detectInternalTransfer,
} from '../financeCalculations';
import { validateAndParseBoleto, calcMod10, calcMod11Bank } from '../boletoValidator';
import { sanitizeCellForSheet } from '../sheetGuard';
import { Transaction, Account } from '../../types';

function buildValid47Boleto(amountCents: number, factor: number): string {
  const bank = '237';
  const curr = '9';
  const fStr = String(factor).padStart(4, '0');
  const vStr = String(amountCents).padStart(10, '0');
  const free = '1234567890123456789012345'; // 25 digits
  const barcodeNoDv = bank + curr + fStr + vStr + free; // 43 digits
  const dvGeral = calcMod11Bank(barcodeNoDv);

  const c1 = bank + curr + free.slice(0, 5);
  const c2 = free.slice(5, 15);
  const c3 = free.slice(15, 25);

  return (
    c1 +
    String(calcMod10(c1)) +
    c2 +
    String(calcMod10(c2)) +
    c3 +
    String(calcMod10(c3)) +
    String(dvGeral) +
    fStr +
    vStr
  );
}

describe('FINANCE IA - Core Calculations & Validators', () => {
  it('calculates derived account balances strictly via accountId ignoring cancelled', () => {
    const accounts: Account[] = [
      { id: 'acc-1', entityId: 'CPF', institutionName: 'Banco Inter', accountName: 'Conta Principal', accountType: 'checking', openingBalance: 1000, balance: 0 },
      { id: 'acc-2', entityId: 'CPF', institutionName: 'Banco Inter 2', accountName: 'Reserva', accountType: 'savings', openingBalance: 500, balance: 0 },
    ];
    const transactions: Transaction[] = [
      { id: 'tr-1', entityId: 'CPF', accountId: 'acc-1', date: '2026-11-05', description: 'Salário', category: 'Salário', account: 'Banco Inter', amount: 4200, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' },
      { id: 'tr-2', entityId: 'CPF', accountId: 'acc-1', date: '2026-11-10', description: 'Aluguel', category: 'Moradia', account: 'Banco Inter', amount: 600.15, direction: 'EXPENSE', status: 'CONFIRMED', origin: 'MANUAL' },
      { id: 'tr-3', entityId: 'CPF', accountId: 'acc-1', date: '2026-11-11', description: 'Cancelado', category: 'Outros', account: 'Banco Inter', amount: 999, direction: 'EXPENSE', status: 'CANCELLED', origin: 'MANUAL' },
    ];

    const updated = calculateAccountBalances(accounts, transactions);
    expect(updated[0].balance).toBe(4599.85);
    expect(updated[1].balance).toBe(500);
  });

  it('parses Brazilian and standard currency strings without float errors', () => {
    expect(parseCurrencyInput('1.234,56')).toBe(1234.56);
    expect(parseCurrencyInput('245,90')).toBe(245.9);
    expect(parseCurrencyInput('150.00')).toBe(150);
  });

  it('filters transactions by period (YYYY-MM and YYYY)', () => {
    const transactions: Transaction[] = [
      { id: '1', entityId: 'CPF', accountId: 'acc-1', date: '2026-11-05', description: 'A', category: 'A', account: 'A', amount: 100, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' },
      { id: '2', entityId: 'CPF', accountId: 'acc-1', date: '2026-10-15', description: 'B', category: 'B', account: 'A', amount: 200, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' },
    ];

    expect(filterTransactionsByPeriod(transactions, '2026-11').map(t => t.id)).toEqual(['1']);
    expect(filterTransactionsByPeriod(transactions, '2026').length).toBe(2);
  });

  it('calculates 50/30/20 budget from real income excluding internal transfers and expenses', () => {
    const trs: Transaction[] = [
      { id: '1', entityId: 'CPF', accountId: 'acc-1', date: '2026-11-05', description: 'Salário', category: 'Salário', account: 'A', amount: 10000, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL' },
      { id: '2', entityId: 'CPF', accountId: 'acc-1', date: '2026-11-06', description: 'Transferência própria', category: 'Transferência', account: 'A', amount: 5000, direction: 'INCOME', status: 'CONFIRMED', origin: 'MANUAL', isInternalTransfer: true },
      { id: '3', entityId: 'CPF', accountId: 'acc-1', date: '2026-11-07', description: 'Aluguel', category: 'Moradia', account: 'A', amount: 1200, direction: 'EXPENSE', status: 'CONFIRMED', origin: 'MANUAL' },
    ];

    const budget = calculateBudget503020(trs);
    expect(budget.realIncome).toBe(10000);
    expect(budget.needs).toBe(5000);
    expect(budget.wants).toBe(3000);
    expect(budget.savings).toBe(2000);
  });

  it('detects duplicate transactions with normalized description and Pix E2E externalId', () => {
    const existing: Transaction[] = [
      {
        id: '1',
        entityId: 'CPF',
        accountId: 'acc-1',
        date: '2026-11-05',
        description: 'Energia  Elétrica',
        category: 'Moradia',
        account: 'A',
        amount: 150,
        direction: 'EXPENSE',
        status: 'CONFIRMED',
        origin: 'MANUAL',
        externalId: 'E00416968202611051200ABC',
      },
    ];

    expect(checkDuplicateTransaction(existing, { date: '2026-11-05', amount: 150, description: 'energia eletrica' })).toBe(true);
    expect(checkDuplicateTransaction(existing, { date: '2026-11-06', amount: 150, description: 'energia eletrica' })).toBe(false);
    expect(
      checkDuplicateTransaction(existing, {
        date: '2026-11-09',
        amount: 999,
        description: 'Outro texto',
        externalId: 'e00416968202611051200abc',
      })
    ).toBe(true);
  });

  it('detects internal transfers between user accounts automatically', () => {
    const accounts: Account[] = [
      { id: 'acc-1', entityId: 'CPF', institutionName: 'Banco Inter', accountName: 'Conta Corrente', accountType: 'checking', openingBalance: 0, balance: 0 },
      { id: 'acc-3', entityId: 'CNPJ', institutionName: 'Nubank Empresa', accountName: 'Conta PJ MEI', accountType: 'business', openingBalance: 0, balance: 0 },
    ];

    expect(
      detectInternalTransfer(
        {
          operationType: 'PIX',
          originAccountHint: 'Banco Inter',
          destinationAccountHint: 'Nubank Empresa',
        },
        accounts
      )
    ).toBe(true);

    expect(
      detectInternalTransfer(
        {
          operationType: 'PIX',
          originAccountHint: 'Banco Inter',
          destinationAccountHint: 'Padaria Central',
        },
        accounts
      )
    ).toBe(false);
  });

  it('validates real FEBRABAN Mod 10 and Mod 11 boleto linha digitável and rejects tampered digits', () => {
    const validLine = buildValid47Boleto(15025, 1063);
    const parsed = validateAndParseBoleto(validLine);
    expect(parsed.isValid).toBe(true);
    expect(parsed.amount).toBe(150.25);
    expect(parsed.dueDate).toBeDefined();

    // Tamper 1 digit
    const tampered = validLine.slice(0, 5) + ((Number(validLine[5]) + 1) % 10) + validLine.slice(6);
    const invalid = validateAndParseBoleto(tampered);
    expect(invalid.isValid).toBe(false);
    expect(invalid.error).toBeDefined();
  });

  it('prevents spreadsheet formula injection in sheetGuard', () => {
    expect(sanitizeCellForSheet('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCellForSheet('+123')).toBe("'+123");
    expect(sanitizeCellForSheet('-123')).toBe("'-123");
    expect(sanitizeCellForSheet('@cmd')).toBe("'@cmd");
    expect(sanitizeCellForSheet('Normal Text')).toBe('Normal Text');
    expect(sanitizeCellForSheet(1500)).toBe(1500);
  });
});
