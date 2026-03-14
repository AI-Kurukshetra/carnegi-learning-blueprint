import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import type { SchoolFormData } from '../types'

const schema = z.object({
  admin_first_name: z.string().min(1, 'Required'),
  admin_last_name: z.string().min(1, 'Required'),
  admin_email: z.string().email('Invalid email'),
  admin_password: z.string().min(8, 'Min 8 characters'),
  school_name: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required').regex(/^[a-z0-9-]+$/, 'Only lowercase, numbers and hyphens'),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
})

function toSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

interface Props {
  defaultValues?: Partial<SchoolFormData>
  onNext: (data: SchoolFormData) => void
}

export function SchoolDetailsStep({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  })

  const schoolName = watch('school_name')

  function handleSchoolNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setValue('school_name', value)
    setValue('slug', toSlug(value))
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-text-main">School Details</h2>
        <p className="text-sm text-text-main/65 mt-1">Tell us about your school and create your admin account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Admin First Name" error={errors.admin_first_name?.message}>
          <Input {...register('admin_first_name')} placeholder="Jane" />
        </FormField>
        <FormField label="Admin Last Name" error={errors.admin_last_name?.message}>
          <Input {...register('admin_last_name')} placeholder="Doe" />
        </FormField>
      </div>

      <FormField label="Admin Email" error={errors.admin_email?.message}>
        <Input {...register('admin_email')} type="email" placeholder="admin@yourschool.edu" />
      </FormField>

      <FormField label="Password" error={errors.admin_password?.message}>
        <Input {...register('admin_password')} type="password" placeholder="Min 8 characters" />
      </FormField>

      <FormField label="School Name" error={errors.school_name?.message}>
        <Input
          value={schoolName ?? ''}
          onChange={handleSchoolNameChange}
          placeholder="Greenwood Academy"
        />
      </FormField>

      <FormField label="School Slug" error={errors.slug?.message} hint="Used for login — auto-generated from school name">
        <Input {...register('slug')} placeholder="greenwood-academy" />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Address" error={errors.address?.message}>
          <Input {...register('address')} placeholder="123 Main St, City, State" />
        </FormField>
        <FormField label="Phone Number" error={errors.phone?.message}>
          <Input {...register('phone')} placeholder="+1 555 000 0000" />
        </FormField>
      </div>

      <Button type="submit" className="w-full">
        Continue to Plan Selection →
      </Button>
    </form>
  )
}
