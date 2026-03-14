import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { CreateTenantPayload } from '../services/tenants.service'

const createTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name is required.'),
  slug: z
    .string()
    .min(2, 'Slug is required.')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase letters, numbers, and hyphens only.'),
  admin_first_name: z.string().min(2, 'First name is required.'),
  admin_last_name: z.string().min(2, 'Last name is required.'),
  admin_email: z.string().email('Enter a valid admin email.'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters.'),
})

type CreateTenantForm = z.infer<typeof createTenantSchema>

interface CreateTenantModalProps {
  open: boolean
  onClose: () => void
  isSubmitting: boolean
  onSubmit: (payload: CreateTenantPayload) => Promise<void>
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CreateTenantModal({ open, onClose, onSubmit, isSubmitting }: CreateTenantModalProps) {
  const {
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      admin_first_name: '',
      admin_last_name: '',
      admin_email: '',
      admin_password: '',
    },
  })
  const nameRegister = register('name', {
    onChange: (event) => {
      if (dirtyFields.slug) return
      setValue('slug', slugify(String(event.target.value ?? '')), { shouldValidate: true })
    },
  })

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Modal open={open} onClose={onClose} title="Create Tenant" description="Create a new tenant and its initial school admin.">
      <form
        className="space-y-3"
        onSubmit={handleSubmit(async (values) => {
          try {
            await onSubmit(values)
            reset()
            onClose()
          } catch {
            // Errors are handled by caller toast state.
          }
        })}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Tenant Name" error={errors.name?.message}>
            <Input {...nameRegister} placeholder="Greenwood International School" />
          </FormField>
          <FormField label="Slug" error={errors.slug?.message} hint="Lowercase and hyphen-separated.">
            <Input {...register('slug')} placeholder="greenwood-international" />
          </FormField>
          <FormField label="Admin First Name" error={errors.admin_first_name?.message}>
            <Input {...register('admin_first_name')} placeholder="Sarah" />
          </FormField>
          <FormField label="Admin Last Name" error={errors.admin_last_name?.message}>
            <Input {...register('admin_last_name')} placeholder="Johnson" />
          </FormField>
          <FormField label="Admin Email" error={errors.admin_email?.message}>
            <Input type="email" {...register('admin_email')} placeholder="admin@greenwood.edu" />
          </FormField>
          <FormField label="Admin Password" error={errors.admin_password?.message}>
            <Input type="password" {...register('admin_password')} placeholder="Minimum 8 characters" />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Tenant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
