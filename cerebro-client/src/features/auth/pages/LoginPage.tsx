import { Navigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { useAuthStore } from '@/store/auth.store'
import { ROLE_HOME } from '@/routes/role-home'
import { LoginForm } from '../components/LoginForm'

export default function LoginPage() {
  const user = useAuthStore((state) => state.user)
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  return (
    <PublicLayout
      title="Sign in to Cerebro"
      subtitle="Role-isolated access for schools, teachers, and students."
    >
      <LoginForm />
    </PublicLayout>
  )
}
