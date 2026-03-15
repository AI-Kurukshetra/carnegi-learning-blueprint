import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  ShieldCheck,
  BarChart3,
  Sparkles,
  GraduationCap,
  BookOpen,
  Users,
  ArrowRight,
  ChevronDown,
  Zap,
  Target,
  CheckCircle2,
  FileCheck,
  Globe,
  Link2,
  UserPlus,
  PenTool,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import './App.css'

/* ── Intersection Observer hook for scroll-triggered animations ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    el.querySelectorAll('.reveal').forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])
  return ref
}

/* ── Data ── */
const features = [
  {
    icon: Brain,
    title: 'AI-Adaptive Learning',
    desc: 'Bayesian knowledge tracing personalizes every student journey with progressive hints and spaced repetition.',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-Tenant Isolation',
    desc: 'Each school operates in a fully isolated environment with row-level security and scoped telemetry.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Teachers and admins get live mastery dashboards, risk cohort detection, and intervention tracking.',
  },
  {
    icon: Sparkles,
    title: 'Smart Assessments',
    desc: 'Auto-generate questions aligned to Bloom\'s taxonomy and learning objectives with AI review workflows.',
  },
  {
    icon: Target,
    title: 'Standards Alignment',
    desc: 'Map learning objectives to official competency frameworks (Common Core, NGSS, and more) for compliance-ready, standards-driven assessments.',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    desc: 'Students receive immediate scoring, confidence indicators, and guided next steps after every attempt.',
  },
]

const roles = [
  {
    icon: Users,
    title: 'Administrators',
    desc: 'School-wide dashboards, trend alerts, cohort risk detection, and audit-ready intervention trails.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: BookOpen,
    title: 'Teachers',
    desc: 'Low-click assessment authoring, class-level mastery views, and AI-assisted grading workflows.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    icon: GraduationCap,
    title: 'Students',
    desc: 'Clear learning paths, progressive hints, real-time progress tracking, and anxiety-free assessments.',
    color: 'from-cyan-500 to-blue-600',
  },
]

const stats = [
  { value: '6+', label: 'Assessment Types' },
  { value: '100%', label: 'Tenant Isolation' },
  { value: '<200ms', label: 'Response Time' },
  { value: '24/7', label: 'Cloud Availability' },
]

const steps = [
  { num: '01', icon: UserPlus, title: 'Onboard', desc: 'Register your school and configure academic structure in minutes.' },
  { num: '02', icon: PenTool, title: 'Create', desc: 'Teachers map questions to objectives with AI-assisted authoring.' },
  { num: '03', icon: ClipboardList, title: 'Assess', desc: 'Students take adaptive assessments with real-time telemetry.' },
  { num: '04', icon: TrendingUp, title: 'Analyze', desc: 'Dashboards surface mastery gaps, risk cohorts, and intervention paths.' },
]

/* ── Component ── */
function App() {
  const scrollRef = useScrollReveal()

  return (
    <div ref={scrollRef} className="landing">
      {/* Background orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      {/* ━━ Navbar ━━ */}
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">
            <span className="nav-logo">
              <Brain size={20} />
            </span>
            <span className="nav-wordmark">Cerebro</span>
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#standards">Standards</a>
            <a href="#roles">Roles</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn-ghost">Log In</Link>
            <Link to="/signup" className="btn-primary">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━ Hero ━━ */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge reveal">
            <Sparkles size={14} />
            AI-Powered Assessment Platform
          </div>
          <h1 className="hero-title reveal">
            Smarter, Adaptive Learning<br />
            <span className="hero-gradient-text">Tailored to Every Student.</span>
          </h1>
          <p className="hero-subtitle reveal">
            Cerebro combines AI-adaptive assessments, real-time analytics, and personalized
            insights to deliver education that adapts to each individual learner.
          </p>
          <div className="hero-ctas reveal">
            <Link to="/signup?plan=free" className="btn-primary btn-lg">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-outline btn-lg">
              Sign In
            </Link>
          </div>
          <div className="hero-stats reveal">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <a href="#features" className="scroll-hint reveal" aria-label="Scroll to features">
          <ChevronDown size={20} />
        </a>
      </section>

      {/* ━━ Features ━━ */}
      <section id="features" className="section">
        <div className="section-inner">
          <div className="section-header reveal">
            <p className="section-tag">Platform Capabilities</p>
            <h2 className="section-title">Everything you need to transform assessments</h2>
            <p className="section-subtitle">
              Built from the ground up for schools that want data-driven, student-centered evaluation.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="feature-icon">
                  <f.icon size={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ How It Works ━━ */}
      <section id="how-it-works" className="section section-alt">
        <div className="section-inner">
          <div className="section-header reveal">
            <p className="section-tag">How It Works</p>
            <h2 className="section-title">From onboarding to insight in four steps</h2>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={s.num} className="step-card reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="step-icon">
                  <s.icon size={22} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ Standards Alignment ━━ */}
      <section id="standards" className="section">
        <div className="section-inner">
          <div className="section-header reveal">
            <p className="section-tag">Curriculum Compliance</p>
            <h2 className="section-title">Standards-aligned from day one</h2>
            <p className="section-subtitle">
              Map your curriculum to official competency frameworks and ensure every assessment
              meets regulatory requirements — without extra effort.
            </p>
          </div>
          <div className="standards-grid">
            <div className="feature-card reveal" style={{ transitionDelay: '0ms' }}>
              <div className="feature-icon">
                <Globe size={24} />
              </div>
              <h3>National Frameworks</h3>
              <p>Support for Common Core, NGSS, country-specific boards, and custom institutional standards.</p>
            </div>
            <div className="feature-card reveal" style={{ transitionDelay: '80ms' }}>
              <div className="feature-icon">
                <Link2 size={24} />
              </div>
              <h3>Objective Mapping</h3>
              <p>Link every learning objective to one or more competency standards with a many-to-many mapping.</p>
            </div>
            <div className="feature-card reveal" style={{ transitionDelay: '160ms' }}>
              <div className="feature-icon">
                <FileCheck size={24} />
              </div>
              <h3>Compliance Reporting</h3>
              <p>Verify standards coverage across your assessments and identify gaps before audits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━ Roles ━━ */}
      <section id="roles" className="section">
        <div className="section-inner">
          <div className="section-header reveal">
            <p className="section-tag">Built For Everyone</p>
            <h2 className="section-title">One platform, tailored for every role</h2>
            <p className="section-subtitle">
              Each user gets a purpose-built experience designed around their real workflows.
            </p>
          </div>
          <div className="roles-grid">
            {roles.map((r, i) => (
              <div key={r.title} className="role-card reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className={`role-icon-wrap bg-gradient-to-br ${r.color}`}>
                  <r.icon size={28} color="#fff" />
                </div>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ CTA Banner ━━ */}
      <section className="cta-section">
        <div className="cta-card reveal">
          <div className="cta-content">
            <h2>Ready to transform your school's assessments?</h2>
            <p>Join schools using Cerebro to deliver smarter, adaptive, and data-driven evaluations.</p>
            <div className="cta-actions">
              <Link to="/signup?plan=free" className="btn-white btn-lg">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-ghost-light btn-lg">
                Sign In
              </Link>
            </div>
          </div>
          <div className="cta-checklist">
            {['No credit card required', 'Full platform access', '14-day free trial', 'Cancel anytime'].map((item) => (
              <span key={item} className="cta-check-item">
                <CheckCircle2 size={16} /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ Footer ━━ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo">
              <Brain size={18} />
            </span>
            <span className="nav-wordmark">Cerebro</span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#roles">Roles</a>
            <Link to="/login">Login</Link>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} Cerebro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
