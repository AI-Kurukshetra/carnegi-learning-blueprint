import { LogOut, PanelLeft, UserCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { useLogout } from '@/features/auth/hooks/useLogout'

const ignoredSegments = new Set(['super-admin'])

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function TopBar() {
  const location = useLocation()
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const user = useAuthStore((state) => state.user)
  const { mutate: doLogout, isPending: isLoggingOut } = useLogout()

  const breadcrumb = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean).filter((segment) => !ignoredSegments.has(segment))
    if (segments.length === 0) return 'Dashboard'
    return formatSegment(segments[segments.length - 1])
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-30 border-b border-brand-blue/10 bg-white/70 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={toggleSidebar} className="h-9 w-9 p-0 md:hidden">
            <PanelLeft size={16} />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Current View</p>
            <h1 className="text-base font-semibold text-text-main">{breadcrumb}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-600 md:inline-flex">
            <UserCircle2 size={14} />
            <span>{user ? `${user.first_name} ${user.last_name}` : 'Account'}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="gap-1"
            disabled={isLoggingOut}
            onClick={() => doLogout()}
          >
            <LogOut size={14} />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </header>
  )
}
