import { Link } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'

export default function UnauthorizedPage() {
  return (
    <PublicLayout
      title="Access Restricted"
      subtitle="Your role does not have permission to open this route."
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          Route access is enforced by role guard. Use your assigned dashboard to continue.
        </p>
        <Link to="/app">
          <Button className="w-full">Go to my dashboard</Button>
        </Link>
      </div>
    </PublicLayout>
  )
}
