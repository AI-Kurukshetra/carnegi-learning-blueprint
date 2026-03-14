import type { Role } from '../../types/roles'

interface RoleChipProps {
  role: Role
}

export function RoleChip({ role }: RoleChipProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-1 text-xs font-semibold text-text-main">
      {role}
    </span>
  )
}
