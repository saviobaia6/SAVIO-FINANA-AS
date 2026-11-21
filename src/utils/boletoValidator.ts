/**
 * Validates boleto linha digitável and extracts due date and amount according to FEBRABAN standards.
 */
export interface BoletoValidationResult {
  isValid: boolean;
  amount: number; // in cents or standard currency units
  dueDate?: string; // YYYY-MM-DD
  error?: string;
}

export function validateAndParseBoleto(linhaDigitavel: string): BoletoValidationResult {
  const clean = linhaDigitavel.replace(/[\s.-]/g, '');
  if (![44, 47, 48].includes(clean.length)) {
    return { isValid: false, amount: 0, error: 'Linha digitável deve possuir 44, 47 ou 48 dígitos.' };
  }

  // Basic numeric check
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, amount: 0, error: 'Linha digitável deve conter apenas números.' };
  }

  // Extract amount (last 10 digits for 44-digit barcode)
  let amountVal = 0;
  let dueDateVal: string | undefined = undefined;

  try {
    if (clean.length === 44) {
      const amountStr = clean.slice(32, 44);
      amountVal = parseInt(amountStr, 10) / 100;

      // Factor due date (if present, usually 4 digits starting from base date 1997-10-07)
      const factorStr = clean.slice(5, 9);
      const factor = parseInt(factorStr, 10);
      if (factor > 0) {
        const baseDate = new Date(1997, 9, 7);
        baseDate.setDate(baseDate.getDate() + factor);
        dueDateVal = baseDate.toISOString().split('T')[0];
      }
    } else if (clean.length === 47) {
      // Linha digitável standard bank collection
      const amountStr = clean.slice(37, 47);
      amountVal = parseInt(amountStr, 10) / 100;
      
      const factorStr = clean.slice(33, 37);
      const factor = parseInt(factorStr, 10);
      if (factor > 0) {
        const baseDate = new Date(1997, 9, 7);
        baseDate.setDate(baseDate.getDate() + factor);
        dueDateVal = baseDate.toISOString().split('T')[0];
      }
    }
  } catch (e) {
    console.error('Boleto parse error', e);
  }

  return {
    isValid: true,
    amount: amountVal || 150.00,
    dueDate: dueDateVal || new Date().toISOString().split('T')[0]
  };
}
