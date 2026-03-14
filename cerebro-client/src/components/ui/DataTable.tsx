import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface DataTableColumn<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyText?: string
}

export function DataTable<T>({ columns, rows, rowKey, emptyText = 'No data found.' }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-blue/15 bg-white/80">
      <table className="min-w-full divide-y divide-brand-blue/10">
        <thead className="bg-brand-blue/5">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn('px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-blue/10">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-brand-blue/5">
              {columns.map((column) => (
                <td key={String(column.key)} className={cn('px-3 py-2 text-sm text-text-main', column.className)}>
                  {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-8 text-center text-sm text-slate-500" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
