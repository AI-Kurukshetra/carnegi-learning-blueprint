import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import { useSchoolProfile, useUpdateSchoolProfile } from '../hooks/useAdminData'

export default function SchoolProfilePage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useSchoolProfile()
  const updateProfile = useUpdateSchoolProfile()

  if (isLoading) {
    return <LoadingState message="Loading school profile..." />
  }

  if (isError) {
    return <ErrorState message="Failed to load school profile." onRetry={() => void refetch()} />
  }

  return (
    <Card className="p-5">
      <h2 className="text-xl font-semibold text-text-main">School Profile</h2>
      <p className="mt-1 text-sm text-text-main/70">Update school contact and timezone settings.</p>

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          try {
            await updateProfile.mutateAsync({
              address: String(form.get('address') ?? '').trim() || undefined,
              phone: String(form.get('phone') ?? '').trim() || undefined,
              logo_url: String(form.get('logo_url') ?? '').trim() || undefined,
              timezone: String(form.get('timezone') ?? '').trim() || undefined,
            })
            toast.success('School profile updated.')
          } catch {
            toast.error('Unable to update school profile.')
          }
        }}
      >
        <FormField label="Address">
          <Input name="address" defaultValue={data?.address ?? ''} />
        </FormField>
        <FormField label="Phone">
          <Input name="phone" defaultValue={data?.phone ?? ''} />
        </FormField>
        <FormField label="Logo URL">
          <Input name="logo_url" defaultValue={data?.logo_url ?? ''} />
        </FormField>
        <FormField label="Timezone">
          <Input name="timezone" defaultValue={data?.timezone ?? 'UTC'} />
        </FormField>

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
