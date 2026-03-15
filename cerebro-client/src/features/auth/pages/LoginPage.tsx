import { Link, Navigate } from 'react-router-dom'
import { Sparkles, ShieldCheck, School, BookOpen, GraduationCap, Check } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { ROLE_HOME } from '@/routes/role-home'
import { LoginForm } from '../components/LoginForm'

const ROLE_CARDS = [
  {
    title: 'Super Admin',
    icon: ShieldCheck,
    color: 'bg-brand-primary',
    items: [
      'Manage all tenants and schools',
      'Monitor platform-wide analytics',
      'Configure system settings',
      'Oversee billing and invoices',
    ],
  },
  {
    title: 'School Admin',
    icon: School,
    color: 'bg-brand-secondary',
    items: [
      'Set up academic years and grades',
      'Create classrooms and sections',
      'Manage teachers and students',
      'Track school-wide performance',
    ],
  },
  {
    title: 'Teacher',
    icon: BookOpen,
    color: 'bg-ai-glow',
    items: [
      'Create and manage assessments',
      'AI-powered question generation',
      'Review student progress and milestones',
      'Provide hints and grade responses',
    ],
  },
  {
    title: 'Student',
    icon: GraduationCap,
    color: 'bg-vivid-orange',
    items: [
      'Take quizzes and adaptive assessments',
      'Track mastery across learning objectives',
      'Request AI-generated hints',
      'View progress and knowledge states',
    ],
  },
]

export default function LoginPage() {
  const user = useAuthStore((state) => state.user)
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* Left — Role descriptions */}
      <div className="hidden flex-col justify-center bg-gradient-to-br from-brand-primary/5 via-bg-main to-brand-secondary/5 px-8 py-12 lg:flex xl:px-16">
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
          <h2 className="text-2xl font-bold text-text-main">Role-Based Access</h2>
          <p className="mt-1 text-sm text-slate-600">
            Each role has tailored dashboards and capabilities.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {ROLE_CARDS.map((role) => (
            <div
              key={role.title}
              className="animate-slide-up rounded-xl border border-slate-200/60 bg-white/70 p-4 shadow-glass backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className={`grid h-8 w-8 place-items-center rounded-lg ${role.color} text-white`}>
                  <role.icon size={15} />
                </div>
                <h3 className="text-sm font-semibold text-text-main">{role.title}</h3>
              </div>
              <ul className="space-y-1.5">
                {role.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={12} className="mt-0.5 shrink-0 text-brand-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Sign-in form */}
      <div className="flex flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-6 lg:hidden">
            <Link to="/" className="mb-4 flex items-center gap-2 no-underline">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-indigo text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Cerebro</p>
                <p className="text-sm font-semibold text-text-main">Assessment Platform</p>
              </div>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-text-main">Sign in to Cerebro</h1>
          <p className="mt-2 mb-6 text-sm text-slate-600">
            Role-isolated access for schools, teachers, and students.
          </p>

          <LoginForm />
        </div>
      </div>

    </div>
  )
}
