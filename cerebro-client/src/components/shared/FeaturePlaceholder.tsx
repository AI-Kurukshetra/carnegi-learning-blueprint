import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface FeaturePlaceholderProps {
  title: string
  description: string
  primaryActionLabel?: string
  primaryActionTo?: string
}

export function FeaturePlaceholder({
  title,
  description,
  primaryActionLabel,
  primaryActionTo,
}: FeaturePlaceholderProps) {
  return (
    <Card className="page-enter p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Phase 1 Foundation</p>
      <h1 className="mt-2 text-2xl font-bold text-text-main">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-700">{description}</p>
      {primaryActionLabel && primaryActionTo ? (
        <div className="mt-5">
          <Link to={primaryActionTo}>
            <Button type="button" className="gap-2">
              {primaryActionLabel}
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      ) : null}
    </Card>
  )
}
