export function formatScore(score: number, total: number) {
  if (total <= 0) return '0%'
  const percent = Math.round((score / total) * 100)
  return `${percent}%`
}
