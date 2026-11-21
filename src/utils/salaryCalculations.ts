import {
  MONTHS_PT_SHORT,
  SALARY_CATEGORY_GROUPS,
  type SalaryCategory,
  type SalaryRecord,
  type SalaryRecordStatus,
  type SalarySource,
} from '../types/salary';

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatReferenceMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function isRecordPaid(status: SalaryRecordStatus): boolean {
  return status === 'received' || status === 'partially_received';
}

/**
 * Calcula salário líquido a partir de bruto - descontos, respeitando valor líquido informado manualmente.
 */
export function calculateNetSalary(params: {
  grossAmount?: number;
  deductions?: number;
  manualNetAmount?: number | null;
  manualNetOverride?: boolean;
}): { netAmount: number | null; calculatedAuto: boolean } {
  const { grossAmount, deductions = 0, manualNetAmount, manualNetOverride } = params;
  if (manualNetOverride && typeof manualNetAmount === 'number' && Number.isFinite(manualNetAmount)) {
    return { netAmount: roundMoney(Math.max(0, manualNetAmount)), calculatedAuto: false };
  }
  if (typeof grossAmount === 'number' && Number.isFinite(grossAmount) && grossAmount >= 0) {
    const cleanDeductions = Number.isFinite(deductions) && deductions > 0 ? deductions : 0;
    return {
      netAmount: roundMoney(Math.max(0, grossAmount - cleanDeductions)),
      calculatedAuto: true,
    };
  }
  if (typeof manualNetAmount === 'number' && Number.isFinite(manualNetAmount)) {
    return { netAmount: roundMoney(Math.max(0, manualNetAmount)), calculatedAuto: false };
  }
  return { netAmount: null, calculatedAuto: false };
}

function buildSourceCategoryMap(sources?: SalarySource[]): Map<string, SalaryCategory> {
  const map = new Map<string, SalaryCategory>();
  if (sources) {
    for (const s of sources) {
      map.set(s.id, s.category);
    }
  }
  return map;
}

function isLoanRecord(record: SalaryRecord, sourceMap: Map<string, SalaryCategory>): boolean {
  return sourceMap.get(record.sourceId) === 'loan';
}

export function getMonthlyTotal(
  records: SalaryRecord[],
  year: number,
  month: number,
  sources?: SalarySource[],
  options?: { includePartiallyReceived?: boolean; includeLoans?: boolean }
): number {
  const sourceMap = buildSourceCategoryMap(sources);
  const includePartial = options?.includePartiallyReceived ?? true;
  const includeLoans = options?.includeLoans ?? false;

  const total = records
    .filter((record) => {
      if (record.year !== year || record.month !== month) return false;
      if (!includeLoans && isLoanRecord(record, sourceMap)) return false;
      if (record.status === 'received') return true;
      if (includePartial && record.status === 'partially_received') return true;
      return false;
    })
    .reduce((acc, record) => acc + (record.amount ?? 0), 0);

  return roundMoney(total);
}

export function getAnnualTotal(
  records: SalaryRecord[],
  year: number,
  sources?: SalarySource[],
  options?: { includeLoans?: boolean }
): number {
  const sourceMap = buildSourceCategoryMap(sources);
  const includeLoans = options?.includeLoans ?? false;

  const total = records
    .filter((record) => {
      if (record.year !== year) return false;
      if (!includeLoans && isLoanRecord(record, sourceMap)) return false;
      return isRecordPaid(record.status);
    })
    .reduce((acc, record) => acc + (record.amount ?? 0), 0);

  return roundMoney(total);
}

export function getSourceAnnualTotal(
  records: SalaryRecord[],
  sourceId: string,
  year: number,
  options?: { statuses?: SalaryRecordStatus[] }
): number {
  const statuses = options?.statuses;
  const total = records
    .filter((record) => {
      if (record.sourceId !== sourceId || record.year !== year) return false;
      if (statuses) return statuses.includes(record.status);
      return isRecordPaid(record.status);
    })
    .reduce((acc, record) => acc + (record.amount ?? 0), 0);

  return roundMoney(total);
}

export function getMonthlyAverage(
  records: SalaryRecord[],
  year: number,
  sources?: SalarySource[]
): number {
  const sourceMap = buildSourceCategoryMap(sources);
  const monthsWithIncome = new Set(
    records
      .filter(
        (record) =>
          record.year === year &&
          !isLoanRecord(record, sourceMap) &&
          isRecordPaid(record.status) &&
          (record.amount ?? 0) > 0
      )
      .map((record) => record.month)
  );

  if (monthsWithIncome.size === 0) return 0;

  return roundMoney(getAnnualTotal(records, year, sources) / monthsWithIncome.size);
}

export function getSalaryVariation(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function calculateMonthlyVariation(current: number, previous: number): number | null {
  return getSalaryVariation(current, previous);
}

export function calculateSalaryAdjustment(
  oldAmount: number,
  newAmount: number
): number | null {
  if (oldAmount <= 0) return null;
  return ((newAmount - oldAmount) / oldAmount) * 100;
}

export function getSourcesByCategory(sources: SalarySource[]): Record<string, number> {
  return sources.reduce<Record<string, number>>((result, source) => {
    result[source.category] = (result[source.category] ?? 0) + 1;
    return result;
  }, {});
}

export interface AnnualIncomeSummary {
  year: number;
  receivedNetTotal: number;
  receivedGrossTotal: number;
  receivedDeductionsTotal: number;
  expectedTotal: number;
  unknownTotal: number;
  recurringTotal: number;
  extraordinaryTotal: number;
  loanTotal: number;
  monthlyAverage: number;
  highestMonth: { month: number; label: string; total: number } | null;
  lowestMonth: { month: number; label: string; total: number } | null;
  filledMonthsCount: number;
  receivedMonthsCount: number;
  activeSourcesCount: number;
  linkedTransactionsCount: number;
}

export function summarizeAnnualIncome(
  records: SalaryRecord[],
  sources: SalarySource[],
  year: number
): AnnualIncomeSummary {
  const sourceMap = buildSourceCategoryMap(sources);
  const yearRecords = records.filter((r) => r.year === year);

  let receivedNetTotal = 0;
  let receivedGrossTotal = 0;
  let receivedDeductionsTotal = 0;
  let expectedTotal = 0;
  let unknownTotal = 0;
  let recurringTotal = 0;
  let extraordinaryTotal = 0;
  let loanTotal = 0;
  let linkedTransactionsCount = 0;

  const monthlyReceived = new Map<number, number>();
  const filledMonths = new Set<number>();

  for (const r of yearRecords) {
    if (r.amount === null) continue;
    filledMonths.add(r.month);
    const category = sourceMap.get(r.sourceId) ?? 'other';
    const group = SALARY_CATEGORY_GROUPS[category];

    if (r.linkedTransactionId) {
      linkedTransactionsCount += 1;
    }

    if (group === 'loan') {
      if (isRecordPaid(r.status) || r.status === 'unknown') {
        loanTotal += r.amount;
      }
      continue;
    }

    if (isRecordPaid(r.status)) {
      receivedNetTotal += r.amount;
      receivedGrossTotal += r.grossAmount ?? r.amount + (r.deductions ?? 0);
      receivedDeductionsTotal += r.deductions ?? 0;
      monthlyReceived.set(r.month, (monthlyReceived.get(r.month) ?? 0) + r.amount);

      if (group === 'recurring') recurringTotal += r.amount;
      else if (group === 'extraordinary') extraordinaryTotal += r.amount;
    } else if (r.status === 'expected') {
      expectedTotal += r.amount;
    } else if (r.status === 'unknown') {
      unknownTotal += r.amount;
    }
  }

  const positiveMonths = Array.from(monthlyReceived.entries())
    .filter(([, total]) => total > 0)
    .map(([month, total]) => ({
      month,
      label: MONTHS_PT_SHORT[month - 1] || String(month),
      total: roundMoney(total),
    }));

  let highestMonth: AnnualIncomeSummary['highestMonth'] = null;
  let lowestMonth: AnnualIncomeSummary['lowestMonth'] = null;

  for (const item of positiveMonths) {
    if (!highestMonth || item.total > highestMonth.total) highestMonth = item;
    if (!lowestMonth || item.total < lowestMonth.total) lowestMonth = item;
  }

  const receivedMonthsCount = positiveMonths.length;

  return {
    year,
    receivedNetTotal: roundMoney(receivedNetTotal),
    receivedGrossTotal: roundMoney(receivedGrossTotal),
    receivedDeductionsTotal: roundMoney(receivedDeductionsTotal),
    expectedTotal: roundMoney(expectedTotal),
    unknownTotal: roundMoney(unknownTotal),
    recurringTotal: roundMoney(recurringTotal),
    extraordinaryTotal: roundMoney(extraordinaryTotal),
    loanTotal: roundMoney(loanTotal),
    monthlyAverage:
      receivedMonthsCount > 0 ? roundMoney(receivedNetTotal / receivedMonthsCount) : 0,
    highestMonth,
    lowestMonth,
    filledMonthsCount: filledMonths.size,
    receivedMonthsCount,
    activeSourcesCount: sources.filter((s) => s.active).length,
    linkedTransactionsCount,
  };
}

export interface MonthlyChartDatum {
  month: number;
  label: string;
  received: number;
  expected: number;
  unknown: number;
  recurring: number;
  extraordinary: number;
  variationPct: number | null;
}

export function buildMonthlyEvolutionSeries(
  records: SalaryRecord[],
  sources: SalarySource[],
  year: number
): MonthlyChartDatum[] {
  const sourceMap = buildSourceCategoryMap(sources);
  const series: MonthlyChartDatum[] = [];

  for (let month = 1; month <= 12; month++) {
    let received = 0;
    let expected = 0;
    let unknown = 0;
    let recurring = 0;
    let extraordinary = 0;

    for (const r of records) {
      if (r.year !== year || r.month !== month || r.amount === null) continue;
      const cat = sourceMap.get(r.sourceId) ?? 'other';
      const group = SALARY_CATEGORY_GROUPS[cat];
      if (group === 'loan') continue;

      if (isRecordPaid(r.status)) {
        received += r.amount;
        if (group === 'recurring') recurring += r.amount;
        else extraordinary += r.amount;
      } else if (r.status === 'expected') {
        expected += r.amount;
      } else if (r.status === 'unknown') {
        unknown += r.amount;
      }
    }

    const prevReceived = month > 1 ? series[month - 2].received : 0;
    series.push({
      month,
      label: MONTHS_PT_SHORT[month - 1],
      received: roundMoney(received),
      expected: roundMoney(expected),
      unknown: roundMoney(unknown),
      recurring: roundMoney(recurring),
      extraordinary: roundMoney(extraordinary),
      variationPct: month > 1 ? calculateMonthlyVariation(received, prevReceived) : null,
    });
  }

  return series;
}

export interface YearlyComparisonResult {
  yearA: number;
  yearB: number;
  totalYearA: number;
  totalYearB: number;
  sameMonthsTotalA: number;
  sameMonthsTotalB: number;
  commonMonths: number[];
  monthsWithDataA: number;
  monthsWithDataB: number;
  isIncompleteComparison: boolean;
  samePeriodGrowthPct: number | null;
  fullYearGrowthPct: number | null;
  monthlyRows: Array<{
    month: number;
    label: string;
    yearAValue: number;
    yearBValue: number;
  }>;
}

/**
 * Compara o mesmo período entre dois anos sem ocultar diferenças de cobertura de meses.
 */
export function compareYearsSamePeriod(
  records: SalaryRecord[],
  sources: SalarySource[],
  yearA: number,
  yearB: number
): YearlyComparisonResult {
  const monthsWithDataA: number[] = [];
  const monthsWithDataB: number[] = [];
  const monthlyRows: YearlyComparisonResult['monthlyRows'] = [];

  for (let m = 1; m <= 12; m++) {
    const valA = getMonthlyTotal(records, yearA, m, sources);
    const valB = getMonthlyTotal(records, yearB, m, sources);
    if (valA > 0) monthsWithDataA.push(m);
    if (valB > 0) monthsWithDataB.push(m);
    monthlyRows.push({
      month: m,
      label: MONTHS_PT_SHORT[m - 1],
      yearAValue: valA,
      yearBValue: valB,
    });
  }

  const commonMonths = monthsWithDataA.filter((m) => monthsWithDataB.includes(m));
  const sameMonthsTotalA = roundMoney(
    commonMonths.reduce((acc, m) => acc + monthlyRows[m - 1].yearAValue, 0)
  );
  const sameMonthsTotalB = roundMoney(
    commonMonths.reduce((acc, m) => acc + monthlyRows[m - 1].yearBValue, 0)
  );

  const totalYearA = getAnnualTotal(records, yearA, sources);
  const totalYearB = getAnnualTotal(records, yearB, sources);

  const isIncompleteComparison =
    monthsWithDataA.length !== monthsWithDataB.length ||
    monthsWithDataA.length < 12 ||
    monthsWithDataB.length < 12;

  return {
    yearA,
    yearB,
    totalYearA,
    totalYearB,
    sameMonthsTotalA,
    sameMonthsTotalB,
    commonMonths,
    monthsWithDataA: monthsWithDataA.length,
    monthsWithDataB: monthsWithDataB.length,
    isIncompleteComparison,
    samePeriodGrowthPct: getSalaryVariation(sameMonthsTotalB, sameMonthsTotalA),
    fullYearGrowthPct: getSalaryVariation(totalYearB, totalYearA),
    monthlyRows,
  };
}

export function normalizeSourceNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ImportDuplicateInfo {
  duplicateKeys: Set<string>;
  duplicateCount: number;
  newCount: number;
}

export function detectSalaryImportDuplicates(
  incomingSources: SalarySource[],
  incomingRecords: SalaryRecord[],
  existingSources: SalarySource[],
  existingRecords: SalaryRecord[]
): ImportDuplicateInfo {
  const existingSourceById = new Map(
    existingSources.map((s) => [s.id, normalizeSourceNameKey(s.name)])
  );
  const existingCompositeKeys = new Set(
    existingRecords.map((r) => {
      const sKey = existingSourceById.get(r.sourceId) || r.sourceId;
      return `${sKey}::${r.year}::${r.month}`;
    })
  );

  const incomingSourceById = new Map(
    incomingSources.map((s) => [s.id, normalizeSourceNameKey(s.name)])
  );

  const duplicateKeys = new Set<string>();
  let duplicateCount = 0;
  let newCount = 0;

  for (const r of incomingRecords) {
    const sKey = incomingSourceById.get(r.sourceId) || r.sourceId;
    const composite = `${sKey}::${r.year}::${r.month}`;
    if (existingCompositeKeys.has(composite)) {
      duplicateKeys.add(r.id);
      duplicateCount += 1;
    } else {
      newCount += 1;
    }
  }

  return { duplicateKeys, duplicateCount, newCount };
}
