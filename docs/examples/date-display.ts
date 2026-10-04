export function formatInstant(iso: string, culture: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(culture, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

export function formatCalendarDate(value: string, culture: string): string {
  // UTC is used only to format a date-only value without shifting the calendar day.
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '—';
  return new Intl.DateTimeFormat(culture, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}
