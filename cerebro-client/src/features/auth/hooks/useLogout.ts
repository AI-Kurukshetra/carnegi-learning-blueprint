import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from '@/hooks/useToast'
import { queryClient } from '@/lib/query-client'
import { logout } from '../services/auth.service'

export function useLogout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const toast = useToast()

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
    onError: () => {
      // Even if the API call fails, clear local state
      clearAuth()
      queryClient.clear()
      toast.info('You have been logged out.')
      navigate('/login', { replace: true })
    },
  })
}
