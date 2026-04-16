'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
        setEmail('')
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
        setEmail('')
        setPassword('')
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      toast.error(errorMessage)
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

  const submitButtonClass =
    'w-full h-11 text-sm font-semibold text-white transition-all ' +
    'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 ' +
    'hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        setMode(value as AuthMode)
        setEmail('')
        setPassword('')
      }}
      className="w-full"
    >
      {/* 탭 헤더 */}
      <TabsList className="w-full grid grid-cols-3 mb-6 h-10">
        <TabsTrigger value="signin" className="text-sm">
          로그인
        </TabsTrigger>
        <TabsTrigger value="signup" className="text-sm">
          회원가입
        </TabsTrigger>
        <TabsTrigger value="magic" className="text-sm">
          이메일 링크
        </TabsTrigger>
      </TabsList>

      {/* 로그인 탭 */}
      <TabsContent value="signin" className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signin" className="text-sm font-medium">
              이메일
            </Label>
            <Input
              id="email-signin"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="h-11 border-gray-300 focus-visible:border-pink-400 focus-visible:ring-pink-200"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-signin" className="text-sm font-medium">
              비밀번호
            </Label>
            <Input
              id="password-signin"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="6자 이상"
              className="h-11 border-gray-300 focus-visible:border-pink-400 focus-visible:ring-pink-200"
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className={submitButtonClass}>
            {loading ? '처리 중...' : '로그인'}
          </Button>
        </form>
      </TabsContent>

      {/* 회원가입 탭 */}
      <TabsContent value="signup" className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signup" className="text-sm font-medium">
              이메일
            </Label>
            <Input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="h-11 border-gray-300 focus-visible:border-pink-400 focus-visible:ring-pink-200"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-signup" className="text-sm font-medium">
              비밀번호
            </Label>
            <Input
              id="password-signup"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="6자 이상"
              className="h-11 border-gray-300 focus-visible:border-pink-400 focus-visible:ring-pink-200"
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className={submitButtonClass}>
            {loading ? '처리 중...' : '회원가입'}
          </Button>
        </form>
      </TabsContent>

      {/* 이메일 링크 탭 */}
      <TabsContent value="magic" className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-magic" className="text-sm font-medium">
              이메일
            </Label>
            <Input
              id="email-magic"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="h-11 border-gray-300 focus-visible:border-pink-400 focus-visible:ring-pink-200"
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className={submitButtonClass}>
            {loading ? '처리 중...' : '이메일 링크 받기'}
          </Button>

          <p className="text-center text-xs text-gray-500 pt-2">
            이메일로 받은 링크를 클릭하면 자동으로 로그인됩니다.
            <br />
            회원가입 없이 바로 사용 가능합니다.
          </p>
        </form>
      </TabsContent>

      {/* 구분선 + Google 로그인 */}
      <div className="mt-6 space-y-4">
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
            또는
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <svg
            className="mr-2 w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 계속하기
        </Button>
      </div>
    </Tabs>
  )
}
