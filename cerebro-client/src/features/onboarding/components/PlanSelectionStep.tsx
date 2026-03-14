import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLANS, type Plan } from '../types'

interface Props {
  onSelect: (plan: Plan) => void
  onBack: () => void
}

export function PlanSelectionStep({ onSelect, onBack }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-text-main">Choose Your Plan</h2>
        <p className="text-sm text-text-main/65 mt-1">Select the plan that fits your school. Upgrade anytime.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={[
              'relative glass-card p-5 flex flex-col gap-3 cursor-pointer transition-all hover:border-brand-blue/50 hover:-translate-y-1',
              plan.badge ? 'border-brand-blue/40 ring-1 ring-brand-blue/20' : '',
            ].join(' ')}
            onClick={() => onSelect(plan.id)}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{plan.name}</p>
              <p className="text-3xl font-extrabold text-text-main mt-1">{plan.price}</p>
              <p className="text-xs text-text-main/60">{plan.priceDetail}</p>
            </div>

            <p className="text-sm text-text-main/70">{plan.description}</p>

            <ul className="space-y-1.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-main/80">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant={plan.id === 'enterprise' ? 'primary' : plan.id === 'free' ? 'secondary' : 'primary'}
              className="w-full mt-2"
              onClick={(e) => { e.stopPropagation(); onSelect(plan.id) }}
            >
              {plan.id === 'free' ? 'Start Free Trial' : `Get ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-text-main/60 hover:text-text-main transition-colors"
      >
        ← Back to school details
      </button>
    </div>
  )
}
