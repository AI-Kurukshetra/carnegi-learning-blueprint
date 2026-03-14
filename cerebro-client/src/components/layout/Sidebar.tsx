import { Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { getNavForRole } from '@/config/navigation.config'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { cn } from '@/utils/cn'

export function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed)

  if (!user) return null

  const navItems = getNavForRole(user.role)

  return (
    <aside
      className={cn(
        'glass-sidebar hidden min-h-screen shrink-0 transition-all md:block',
        isSidebarCollapsed ? 'w-20' : 'w-72',
      )}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-brand-blue/10 px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-primary text-white">
              <Sparkles size={16} />
            </div>
            {!isSidebarCollapsed ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cerebro</p>
                <p className="text-sm font-semibold text-text-main">Assessment AI</p>
              </div>
            ) : null}
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-primary text-white' : 'text-text-main hover:bg-brand-blue/10',
                )}
              >
                <item.icon size={16} />
                {!isSidebarCollapsed ? <span>{item.label}</span> : null}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
