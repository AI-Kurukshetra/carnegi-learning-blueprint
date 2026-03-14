export function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}
