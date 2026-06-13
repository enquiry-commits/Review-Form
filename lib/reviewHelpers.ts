export function getCurrentReviewPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Days 1-9 of a month = still in previous month's pending window
  if (day <= 9) {
    if (month === 1) return `${year - 1}-12`;
    return `${year}-${String(month - 1).padStart(2, '0')}`;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatPeriodDisplay(period: string): string {
  const [year, month] = period.split('-');
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Backward compatibility
export function getCurrentReviewMonth(): string {
  return formatPeriodDisplay(getCurrentReviewPeriod());
}
