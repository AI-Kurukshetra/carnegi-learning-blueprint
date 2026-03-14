import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROLE_HOME } from '@/routes/role-home'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from '@/hooks/useToast'
import { login, type LoginPayload } from '../services/auth.service'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const toast = useToast()

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data, variables) => {
      setAuth({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tenantSlug: variables.tenant_slug,
      })
      toast.success(`Welcome back, ${data.user.first_name}`)
      navigate(ROLE_HOME[data.user.role], { replace: true })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to login.'
      toast.error(message)
    },
  })
}
