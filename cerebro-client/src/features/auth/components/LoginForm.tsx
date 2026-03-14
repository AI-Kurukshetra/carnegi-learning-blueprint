import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useLogin } from '../hooks/useLogin'

const loginSchema = z.object({
  tenant_slug: z.string().min(1, 'School identifier is required.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const DEMO_CREDENTIALS: Array<{ label: string; email: string; tenant_slug: string }> = [
  { label: 'Super Admin', email: 'superadmin@cerebro.dev', tenant_slug: 'cerebro-platform' },
  { label: 'School Admin', email: 'admin@greenwood-academy.edu', tenant_slug: 'greenwood-academy' },
  { label: 'Teacher', email: 'priya.sharma@greenwood-academy.edu', tenant_slug: 'greenwood-academy' },
  { label: 'Student', email: 'aiden.brooks@greenwood-academy.edu', tenant_slug: 'greenwood-academy' },
]

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate, isPending } = useLogin()
  const [searchParams] = useSearchParams()
  const prefilledSlug = searchParams.get('slug') ?? ''
  const prefilledEmail = searchParams.get('email') ?? ''

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenant_slug: prefilledSlug || 'greenwood-academy',
      email: prefilledEmail || 'priya.sharma@greenwood-academy.edu',
      password: '',
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    mutate(values)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField label="School Identifier" error={errors.tenant_slug?.message}>
        <Input
          type="text"
          placeholder="e.g. greenwood-academy"
          autoComplete="organization"
          {...register('tenant_slug')}
        />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" placeholder="name@school.edu" autoComplete="email" {...register('email')} />
      </FormField>

      <FormField label="Password" error={errors.password?.message}>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            autoComplete="current-password"
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </FormField>

      <Button type="submit" className="w-full justify-center gap-2" disabled={isPending}>
        {isPending ? <LoaderCircle size={14} className="animate-spin" /> : null}
        Sign in
      </Button>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo access</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_CREDENTIALS.map((credential) => (
            <Button
              key={credential.email}
              type="button"
              variant="ghost"
              className="justify-start text-xs"
              onClick={() => {
                setValue('tenant_slug', credential.tenant_slug)
                setValue('email', credential.email)
                setValue('password', 'Password@123')
              }}
            >
              {credential.label}
            </Button>
          ))}
        </div>
      </div>
    </form>
  )
}
