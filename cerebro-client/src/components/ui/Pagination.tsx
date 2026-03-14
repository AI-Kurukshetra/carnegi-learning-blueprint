import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="text-xs font-medium text-slate-600">
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <Button type="button" variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  )
}
