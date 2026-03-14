import type { PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

function isAttemptFocusRoute(pathname: string) {
  return /^\/student\/assessments\/[^/]+\/attempt$/.test(pathname)
}

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation()
  const focusMode = isAttemptFocusRoute(location.pathname)

  if (focusMode) {
    return <main className="min-h-screen bg-slate-950 text-white">{children}</main>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
