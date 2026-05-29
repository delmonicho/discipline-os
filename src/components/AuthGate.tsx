import type { ReactNode } from 'react'
import { useAuth } from '../lib/useAuth'
import { SignIn } from './SignIn'

interface Props { children: ReactNode }

export function AuthGate({ children }: Props) {
  const { session, loading } = useAuth()

  if (loading) return <LoadingShimmer />
  if (!session) return <SignIn />
  return <>{children}</>
}

function LoadingShimmer() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a1c', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2.5px solid rgba(90,209,200,0.2)',
        borderTopColor: '#5ad1c8',
        animation: 'spin .9s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
