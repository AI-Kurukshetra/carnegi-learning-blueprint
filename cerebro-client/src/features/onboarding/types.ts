export type Plan = 'basic' | 'enterprise' | 'free'

export interface PlanConfig {
  id: Plan
  name: string
  price: string
  priceDetail: string
  description: string
  features: string[]
  badge?: string
  amount: number
}

export const PLANS: PlanConfig[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$10',
    priceDetail: 'per user / month',
    description: 'Perfect for small schools',
    amount: 1000,
    features: [
      'Up to 100 users',
      'AI-powered assessments',
      'Real-time analytics',
      'Standards alignment',
      'Email support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$35',
    priceDetail: 'per user / month',
    description: 'For large institutions',
    amount: 3500,
    badge: 'Most Popular',
    features: [
      'Unlimited users',
      'Everything in Basic',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
  },
  {
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    priceDetail: 'for 7 days',
    description: 'Full platform access',
    amount: 0,
    features: [
      'Full platform access',
      'All features included',
      'No credit card required',
      'Upgrade anytime',
    ],
  },
]

export interface SchoolFormData {
  admin_first_name: string
  admin_last_name: string
  admin_email: string
  admin_password: string
  school_name: string
  slug: string
  address: string
  phone: string
}
