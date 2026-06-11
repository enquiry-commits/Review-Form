export function getCurrentReviewMonth(): string {
  const now = new Date();
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return `${month} ${year}`;
}
