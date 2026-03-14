export function truncate(value: string, max = 120) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}
