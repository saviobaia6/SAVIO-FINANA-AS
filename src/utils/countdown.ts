export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  status: 'PAID' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'FUTURE';
  label: string;
  badgeColor: string;
}

export function calculateCountdown(dueDateStr: string, isPaid: boolean = false): CountdownResult {
  if (isPaid) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      status: 'PAID',
      label: 'Conta Paga',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  const now = new Date();
  const due = new Date(dueDateStr + 'T23:59:59');
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      days: overdueDays,
      hours: Math.abs(diffHours),
      minutes: Math.abs(diffMinutes),
      status: 'OVERDUE',
      label: `Vencido há ${overdueDays} dia${overdueDays !== 1 ? 's' : ''}`,
      badgeColor: 'bg-red-50 text-red-700 border-red-200'
    };
  }

  if (diffDays === 0) {
    return {
      days: 0,
      hours: diffHours,
      minutes: diffMinutes,
      status: 'DUE_TODAY',
      label: `Vence hoje (${diffHours}h ${diffMinutes}m restantes)`,
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
    };
  }

  if (diffDays <= 3) {
    return {
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes,
      status: 'UPCOMING',
      label: `Vencimento próximo: ${diffDays}d ${diffHours}h restantes`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }

  return {
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes,
    status: 'FUTURE',
    label: `${diffDays} dias restantes`,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  };
}
