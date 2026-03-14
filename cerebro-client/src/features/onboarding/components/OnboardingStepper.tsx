interface Step {
  number: number
  label: string
}

const STEPS: Step[] = [
  { number: 1, label: 'School Details' },
  { number: 2, label: 'Choose Plan' },
  { number: 3, label: 'Payment' },
  { number: 4, label: 'Done' },
]

export function OnboardingStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={[
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                current === step.number
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
                  : current > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-white/40 text-text-main/40 border border-brand-blue/20',
              ].join(' ')}
            >
              {current > step.number ? '✓' : step.number}
            </div>
            <span
              className={[
                'mt-1.5 text-xs font-medium whitespace-nowrap',
                current === step.number ? 'text-brand-blue' : 'text-text-main/50',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={[
                'h-0.5 w-12 mx-1 mb-5 transition-all',
                current > step.number ? 'bg-green-400' : 'bg-brand-blue/15',
              ].join(' ')}
            />
          )}
        </div>
      ))}
    </div>
  )
}
