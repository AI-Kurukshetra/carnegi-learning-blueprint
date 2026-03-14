import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Tenant } from '@/types/domain.types'
import type { UpdateTenantPayload } from '../services/tenants.service'

const editTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name is required.'),
  is_active: z.boolean(),
})

type EditTenantForm = z.infer<typeof editTenantSchema>

interface EditTenantModalProps {
  open: boolean
  tenant: Tenant | null
  onClose: () => void
  isSubmitting: boolean
  onSubmit: (tenantId: string, payload: UpdateTenantPayload) => Promise<void>
}

export function EditTenantModal({ open, tenant, onClose, onSubmit, isSubmitting }: EditTenantModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTenantForm>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      name: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (!tenant) {
      reset({ name: '', is_active: true })
      return
    }
    reset({ name: tenant.name, is_active: tenant.is_active })
  }, [tenant, reset])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Tenant"
      description="Update tenant name or active status. Slug cannot be changed."
    >
      <form
        className="space-y-3"
        onSubmit={handleSubmit(async (values) => {
          if (!tenant) return
          try {
            await onSubmit(tenant.id, values)
            onClose()
          } catch {
            // Errors are handled by caller toast state.
          }
        })}
      >
        <FormField label="Tenant Name" error={errors.name?.message}>
          <Input {...register('name')} />
        </FormField>

        <label className="flex items-center gap-2 rounded-lg border border-brand-blue/15 bg-white/60 p-3 text-sm text-text-main">
          <input type="checkbox" {...register('is_active')} />
          Tenant is active
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
