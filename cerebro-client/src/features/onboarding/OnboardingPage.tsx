import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Brain } from 'lucide-react'
import { LoadingState } from '@/components/shared/LoadingState'
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay'
import { createOrder, completeOnboarding, startFreeTrial } from './services/onboarding.service'
import { OnboardingStepper } from './components/OnboardingStepper'
import { SchoolDetailsStep } from './components/SchoolDetailsStep'
import { PlanSelectionStep } from './components/PlanSelectionStep'
import { SuccessStep } from './components/SuccessStep'
import { PLANS, type Plan, type SchoolFormData } from './types'

type OnboardingStep = 1 | 2 | 3 | 4

export default function OnboardingPage() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<OnboardingStep>(1)
  const [schoolData, setSchoolData] = useState<SchoolFormData | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ tenant_slug: string } | null>(null)

  const initialPlan = searchParams.get('plan') as Plan | null

  function handleSchoolDetails(data: SchoolFormData) {
    setSchoolData(data)
    if (initialPlan === 'free') {
      handlePlanSelect('free', data)
    } else {
      setStep(2)
    }
  }

  async function handlePlanSelect(plan: Plan, data?: SchoolFormData) {
    const formData = data ?? schoolData
    if (!formData) return

    setSelectedPlan(plan)
    setStep(3)

    if (plan === 'free') {
      setProcessing(true)
      try {
        const res = await startFreeTrial({
          school_name: formData.school_name,
          slug: formData.slug,
          admin_first_name: formData.admin_first_name,
          admin_last_name: formData.admin_last_name,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
          address: formData.address,
          phone: formData.phone,
        })
        setResult({ tenant_slug: res.tenant_slug })
        setStep(4)
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        toast.error(message ?? 'Failed to start free trial.')
        setStep(2)
      } finally {
        setProcessing(false)
      }
      return
    }

    const planConfig = PLANS.find((p) => p.id === plan)!
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      toast.error('Failed to load payment gateway. Please check your connection.')
      setStep(2)
      return
    }

    setProcessing(true)
    try {
      const order = await createOrder({
        amount: planConfig.amount,
        currency: 'INR',
        admin_email: formData.admin_email,
        plan,
      })
      setProcessing(false)

      openRazorpayCheckout({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Cerebro',
        description: `${planConfig.name} Plan — School Onboarding`,
        order_id: order.order_id,
        prefill: {
          name: `${formData.admin_first_name} ${formData.admin_last_name}`,
          email: formData.admin_email,
        },
        theme: { color: '#007AFF' },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.')
            setStep(2)
          },
        },
        handler: async (response) => {
          setProcessing(true)
          try {
            const res = await completeOnboarding({
              school_name: formData.school_name,
              slug: formData.slug,
              admin_first_name: formData.admin_first_name,
              admin_last_name: formData.admin_last_name,
              admin_email: formData.admin_email,
              admin_password: formData.admin_password,
              address: formData.address,
              phone: formData.phone,
              plan,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            })
            setResult({ tenant_slug: res.tenant_slug })
            setStep(4)
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
            toast.error(message ?? 'Failed to complete setup. Contact support.')
            setStep(2)
          } finally {
            setProcessing(false)
          }
        },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      toast.error(message ?? 'Failed to create payment order.')
      setStep(2)
      setProcessing(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center justify-start px-4 py-6">
      <Link to="/" className="flex items-center gap-2 mb-6 text-text-main no-underline lg:hidden">
        <span className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center">
          <Brain size={20} className="text-white" />
        </span>
        <span className="text-lg font-bold tracking-tight">Cerebro</span>
      </Link>

      <div className="w-full max-w-xl p-6">
        <OnboardingStepper current={step} />

        {step === 1 && (
          <SchoolDetailsStep defaultValues={schoolData ?? undefined} onNext={handleSchoolDetails} />
        )}

        {step === 2 && (
          <PlanSelectionStep
            onSelect={(plan) => void handlePlanSelect(plan)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && processing && (
          <div className="py-12">
            <LoadingState
              message={selectedPlan === 'free' ? 'Setting up your school…' : 'Processing payment…'}
            />
          </div>
        )}

        {step === 4 && result && schoolData && (
          <SuccessStep
            tenantSlug={result.tenant_slug}
            adminEmail={schoolData.admin_email}
            planName={selectedPlan ?? 'free'}
          />
        )}
      </div>

      <p className="mt-6 text-sm text-text-main/50">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-blue hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
