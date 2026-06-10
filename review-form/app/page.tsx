'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authenticate } from '@/lib/auth'

const SAVED_EMAIL_KEY = 'tassure_login_email'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY)
    if (saved) setEmail(saved)
  }, [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = await authenticate(email, password)
      if (user) {
        localStorage.setItem(SAVED_EMAIL_KEY, email)
        localStorage.setItem('user', JSON.stringify(user))
        router.push('/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* 容器：最大宽度 448px (max-w-sm = 24rem) */}
      <div className="w-full max-w-sm">
        {/* 标题区：底部间距 32px (mb-8 = 2rem) */}
        <div className="text-center mb-8">
          {/* 标题：字体大小 24px (text-2xl)，粗体，颜色深灰 */}
          <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
          {/* 副标题：字体大小 14px (text-sm)，颜色浅灰，上方间距 4px */}
          <p className="text-sm text-gray-500 mt-1">Tassure Review System</p>
        </div>

        {/* 表单：白色背景，圆角 16px，阴影，边框 1px，内边距 32px (p-8 = 2rem)，元素间距 20px (space-y-5) */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {/* Email 输入框组 */}
          <div>
            {/* Label：字体大小 14px，粗体，颜色灰色，下方间距 4px */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {/* 输入框：宽度 100%，边框 1px，圆角 8px，内边距 左右 16px (px-4)，上下 10px (py-2.5)，字体 14px */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="vincent@tassure.com"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          {/* Password 输入框组（同上） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          {/* 错误提示：红色背景，边框，圆角 8px，内边距 16px 上下，字体 14px */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* 提交按钮：宽度 100%，内边距上下 12px (py-3 = 0.75rem)，圆角 8px，字体 14px */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}
