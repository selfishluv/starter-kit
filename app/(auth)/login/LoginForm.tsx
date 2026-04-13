'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'signin' | 'signup' | 'magic'

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        toast.success('이메일을 확인해주세요! 로그인 링크를 보내드렸습니다.')
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        toast.success('가입 완료! 이메일 인증 후 로그인해주세요.')
        setMode('signin')
        return
      }

      // 로그인
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // 로그인 성공 시 대시보드로 이동
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message ?? '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <div className="flex rounded-lg border border-rose-100 p-1 bg-rose-50">
        {(['signin', 'signup', 'magic'] as AuthMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
              mode === m
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {m === 'signin' ? '로그인' : m === 'signup' ? '회원가입' : '이메일 링크'}
          </button>
        ))}
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            placeholder="name@example.com"
          />
        </div>

        {mode !== 'magic' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              placeholder="6자 이상"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white"
        >
          {loading
            ? '처리 중...'
            : mode === 'signin'
            ? '로그인'
            : mode === 'signup'
            ? '회원가입'
            : '이메일 링크 받기'}
        </Button>
      </form>

      {/* 구분선 */}
      <div className="relative flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="mx-3 text-xs text-gray-400">또는</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Google 로그인 */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        <span className="mr-2">G</span>
        Google로 계속하기
      </Button>

      {mode === 'magic' && (
        <p className="text-center text-xs text-gray-500">
          이메일로 받은 링크를 클릭하면 자동으로 로그인됩니다.
          <br />
          회원가입 없이 바로 사용 가능합니다.
        </p>
      )}
    </div>
  )
}