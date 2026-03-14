import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { useToast } from '@/hooks/useToast'
import { getMe, updateMe, type UpdateMePayload, type MeData } from '../services/auth.service'

const ME_QUERY_KEY = ['auth', 'me'] as const

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const updateUser = useAuthStore((state) => state.updateUser)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await getMe()
        // Sync the store with the latest user data from the server
        updateUser(data)
        return data
      } catch {
        // Token is invalid — clear auth
        clearAuth()
        throw new Error('Session expired')
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((state) => state.updateUser)
  const toast = useToast()

  return useMutation({
    mutationFn: (payload: UpdateMePayload) => updateMe(payload),
    onSuccess: (data: MeData) => {
      updateUser(data)
      queryClient.setQueryData(ME_QUERY_KEY, data)
      toast.success('Profile updated')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update profile.'
      toast.error(message)
    },
  })
}
