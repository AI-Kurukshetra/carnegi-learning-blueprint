import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

interface Props {
  tenantSlug: string
  adminEmail: string
  planName: string
}

export function SuccessStep({ tenantSlug, adminEmail, planName }: Props) {
  const loginUrl = `/login?slug=${tenantSlug}&email=${encodeURIComponent(adminEmail)}`

  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-main">Your school is ready!</h2>
        <p className="text-text-main/65 mt-2">
          {planName === 'free' ? 'Your 7-day free trial has been activated.' : `${planName} plan activated successfully.`}
        </p>
      </div>

      <div className="glass-card p-5 text-left space-y-3">
        <p className="text-sm font-semibold text-text-main">Login credentials</p>
        <div className="space-y-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-main/50">School Slug</p>
            <p className="font-mono text-sm font-bold text-brand-blue mt-0.5">{tenantSlug}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-main/50">Admin Email</p>
            <p className="text-sm text-text-main mt-0.5">{adminEmail}</p>
          </div>
        </div>
        <p className="text-xs text-text-main/50 pt-1">
          Use your slug and email to log into the platform.
        </p>
      </div>

      <Link to={loginUrl}>
        <Button type="button" className="w-full">
          Go to Login →
        </Button>
      </Link>
    </div>
  )
}
