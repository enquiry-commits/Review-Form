'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { signInWithGoogle, resolveSessionUser, logout, ALLOWED_EMAIL_DOMAIN } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true) // resolving any existing/returning session
  const [loading, setLoading] = useState(false)  // redirecting to Google
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function finalize() {
      const { user, reason } = await resolveSessionUser()
      if (!active) return
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
        router.push('/dashboard')
        return
      }
      if (reason === 'wrong-domain') {
        await logout()
        setError(`Please sign in with your @${ALLOWED_EMAIL_DOMAIN} Google account.`)
      } else if (reason === 'not-registered') {
        await logout()
        setError('This account is not registered in the review system. Contact an admin.')
      }
      // reason === 'no-session' → just show the sign-in button
      if (active) setChecking(false)
    }

    finalize()
    // After returning from Google, supabase-js parses the URL and emits SIGNED_IN.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') finalize()
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [router])

  async function handleGoogle() {
    setLoading(true)
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error)
      setLoading(false)
    }
    // On success the browser is redirected to Google.
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
          <p className="text-sm text-gray-500 mt-1">Tassure Review System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {checking ? (
            <div className="text-center text-sm text-gray-500 py-6">Checking session…</div>
          ) : (
            <>
              <p className="text-sm text-gray-600 text-center">
                Use your company Google account
                <br />
                <span className="text-gray-400">使用公司 Google 账号登录</span>
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-medium py-3 rounded-lg transition-colors text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
                {loading ? 'Redirecting…' : 'Sign in with Google'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Only @{ALLOWED_EMAIL_DOMAIN} accounts can access this system.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
