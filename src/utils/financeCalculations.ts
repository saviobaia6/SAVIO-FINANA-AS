import { Transaction, Account } from '../types';

export function calculateAccountBalances(accounts: Account[], transactions: Transaction[]): Account[] {
  return accounts.map(acc => {
    const accTransactions = transactions.filter(t => 
      t.account.toLowerCase() === acc.accountName.toLowerCase() ||
      t.account.toLowerCase() === acc.institutionName.toLowerCase()
    );

    const sum = accTransactions.reduce((accSum, t) => {
      return accSum + (t.direction === 'INCOME' ? t.amount : -t.amount);
    }, 0);

    return {
      ...acc,
      balance: acc.openingBalance ? acc.openingBalance + sum : acc.balance + sum
    };
  });
}

export function filterTransactionsByPeriod(transactions: Transaction[], period: string): Transaction[] {
  // period format: 'YYYY-MM' or 'YYYY'
  if (!period || period === 'ALL') return transactions;
  return transactions.filter(t => t.date.startsWith(period));
}

export function calculateBudget503020(incomeTransactions: Transaction[]) {
  const realIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  return {
    realIncome,
    needs: realIncome * 0.50,
    wants: realIncome * 0.30,
    savings: realIncome * 0.20
  };
}

export function checkDuplicateTransaction(existingTransactions: Transaction[], newTr: { date: string; amount: number; description: string }): boolean {
  return existingTransactions.some(t => 
    t.date === newTr.date && 
    t.amount === newTr.amount && 
    t.description.trim().toLowerCase() === newTr.description.trim().toLowerCase()
  );
}
