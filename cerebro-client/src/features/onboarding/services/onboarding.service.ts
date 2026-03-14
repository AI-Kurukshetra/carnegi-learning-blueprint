import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'

export interface CreateOrderPayload {
  amount: number
  currency: string
  admin_email: string
  plan: string
}

export interface CreateOrderResponse {
  order_id: string
  amount: number
  currency: string
  key_id: string
}

export interface CompleteOnboardingPayload {
  school_name: string
  slug: string
  admin_first_name: string
  admin_last_name: string
  admin_email: string
  admin_password: string
  address?: string
  phone?: string
  plan: string
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface FreeTrialPayload {
  school_name: string
  slug: string
  admin_first_name: string
  admin_last_name: string
  admin_email: string
  admin_password: string
  address?: string
  phone?: string
}

export interface OnboardingResult {
  tenant_slug: string
  message: string
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const res = await apiClient.post<ApiSuccess<CreateOrderResponse>>('/onboarding/create-order', payload)
  if (!res.data.success) throw new Error('Failed to create payment order.')
  return res.data.data
}

export async function completeOnboarding(payload: CompleteOnboardingPayload): Promise<OnboardingResult> {
  const res = await apiClient.post<ApiSuccess<OnboardingResult>>('/onboarding/complete', payload)
  if (!res.data.success) throw new Error('Failed to complete onboarding.')
  return res.data.data
}

export async function startFreeTrial(payload: FreeTrialPayload): Promise<OnboardingResult> {
  const res = await apiClient.post<ApiSuccess<OnboardingResult>>('/onboarding/free-trial', payload)
  if (!res.data.success) throw new Error('Failed to start free trial.')
  return res.data.data
}
