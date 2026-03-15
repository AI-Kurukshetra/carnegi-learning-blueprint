import { Link } from 'react-router-dom'
import {
  Sparkles,
  Brain,
  ClipboardCheck,
  Users,
  BarChart3,
  BookOpenCheck,
  Check,
} from 'lucide-react'
import OnboardingPage from '@/features/onboarding/OnboardingPage'

const HIGHLIGHTS = [
  {
    icon: Brain,
    color: 'bg-brand-primary',
    title: 'AI-Adaptive Learning',
    items: [
      'Personalized learning paths per student',
      'Bayesian knowledge tracing',
      'Progressive hint system',
    ],
  },
  {
    icon: ClipboardCheck,
    color: 'bg-brand-secondary',
    title: 'Smart Assessment Generation',
    items: [
      'AI-generated questions from objectives',
      "Bloom's taxonomy alignment",
      'Adaptive difficulty scaling',
    ],
  },
  {
    icon: Users,
    color: 'bg-ai-glow',
    title: 'Effortless Management',
    items: [
      'Classrooms, subjects & sections',
      'Teacher & student onboarding',
      'Academic year configuration',
    ],
  },
  {
    icon: BarChart3,
    color: 'bg-vivid-orange',
    title: 'AI-Powered Insights',
    items: [
      'Real-time mastery dashboards',
      'Risk cohort detection',
      'Performance trend analytics',
    ],
  },
  {
    icon: BookOpenCheck,
    color: 'bg-status-error',
    title: 'AI-Assisted Tutoring',
    items: [
      'Context-aware hints on assignments',
      'Instant feedback and scoring',
      'Guided next-step recommendations',
    ],
  },
  {
    icon: Sparkles,
    color: 'bg-brand-primary',
    title: 'Standards Compliance',
    items: [
      'Map to national frameworks',
      'Competency standard alignment',
      'Audit-ready reporting',
    ],
  },
]

export default function SignupPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* Left — App highlights */}
      <div className="hidden flex-col justify-start bg-gradient-to-br from-brand-primary/5 via-bg-main to-brand-secondary/5 px-8 pt-24 pb-12 lg:flex xl:px-16">
        <div className="mb-8">
          <Link to="/" className="mb-3 flex items-center gap-2 no-underline">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-indigo text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cerebro</p>
              <p className="text-sm font-semibold text-text-main">AI-Adaptive Assessment Platform</p>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-text-main">Everything Your School Needs</h2>
          <p className="mt-1 text-sm text-slate-600">
            One platform for adaptive learning, assessments, and analytics.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="animate-slide-up rounded-xl border border-slate-200/60 bg-white/70 p-4 shadow-glass backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className={`grid h-8 w-8 place-items-center rounded-lg ${item.color} text-white`}>
                  <item.icon size={15} />
                </div>
                <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
              </div>
              <ul className="space-y-1.5">
                {item.items.map((text) => (
                  <li key={text} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={12} className="mt-0.5 shrink-0 text-brand-primary" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Signup form */}
      <div className="flex flex-col items-center justify-center bg-white px-6 py-10 overflow-y-auto">
        <OnboardingPage />
      </div>

    </div>
  )
}
