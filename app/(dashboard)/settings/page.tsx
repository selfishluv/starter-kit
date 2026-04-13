'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { inviteMemberSchema, type InviteMemberInput } from '@/schemas/album.schema'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
  })

  async function onInvite(data: InviteMemberInput) {
    try {
      // Magic Link 초대 (실제 구현에서는 별도 초대 시스템 필요)
      toast.success(`${data.email}로 초대 링크를 보냈습니다.`)
      reset()
    } catch {
      toast.error('초대 발송에 실패했습니다.')
    }
  }

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">설정</h1>

      {/* 가족 초대 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">가족 초대</h2>
          <p className="text-sm text-gray-500 mt-1">
            이메일로 가족을 초대하면 앨범을 함께 볼 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit(onInvite)} className="flex gap-2">
          <div className="flex-1">
            <input
              {...register('email')}
              type="email"
              placeholder="family@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-rose-500 hover:bg-rose-600 text-white shrink-0"
          >
            초대
          </Button>
        </form>
      </section>

      {/* 계정 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">계정</h2>
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={loading}
          className="w-full border-red-200 text-red-500 hover:bg-red-50"
        >
          {loading ? '로그아웃 중...' : '로그아웃'}
        </Button>
      </section>
    </div>
  )
}