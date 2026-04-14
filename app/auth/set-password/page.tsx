'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function SetPasswordPageContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/settings'
  const supabase = createClient()

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()

    // 검증
    if (!password || !confirmPassword) {
      toast.error('비밀번호와 확인을 모두 입력해주세요.')
      return
    }

    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('비밀번호와 확인이 일치하지 않습니다.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        console.error('비밀번호 설정 오류:', error)
        toast.error('비밀번호 설정에 실패했습니다.')
        return
      }

      toast.success('비밀번호가 설정되었습니다!')
      router.push(next)
    } catch (err) {
      console.error('비밀번호 설정 오류:', err)
      toast.error('비밀번호 설정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSkip() {
    router.push(next)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white border border-gray-100 p-6 shadow-sm space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">가입 완료!</h1>
            <p className="text-sm text-gray-600">
              비밀번호를 설정하여 언제든지 로그인할 수 있습니다.
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상의 비밀번호"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">최소 8자 이상이어야 합니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                disabled={isLoading}
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1"
              >
                나중에 설정
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
              >
                {isLoading ? '설정 중...' : '비밀번호 설정'}
              </Button>
            </div>
          </form>

          {/* 안내 문구 */}
          <p className="text-xs text-gray-500 text-center">
            비밀번호는 설정 페이지에서 언제든 변경할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="rounded-xl bg-white border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">로드 중...</h1>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SetPasswordPageContent />
    </Suspense>
  )
}
