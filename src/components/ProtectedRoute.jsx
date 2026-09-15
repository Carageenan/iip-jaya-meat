import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { session, loading, isAdmin, roleLoading } = useAuth()

  if (loading || (session && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/kasir" replace />
  }

  return children
}
