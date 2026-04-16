'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateUserProfile, requestPasswordReset, requestEmailChange } from '@/lib/actions/user.actions'
import { Button } from '@/components/ui/button'

interface CurrentUser {
  email: string
  created_at: string
  last_sign_in_at?: string
}

interface AccountTabProps {
  currentUser: CurrentUser | null
  loading: boolean
  onSignOut: () => void
}

interface ProfileFormData {
  displayName: string
}

export function AccountTab({ currentUser, loading, onSignOut }: AccountTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    defaultValues: {
      displayName: '',
    },
  })

  const handleUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    try {
      await updateUserProfile({ displayName: data.displayName })
      toast.success('프로필이 업데이트되었습니다.')
      setIsEditing(false)
      reset()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordReset = async () => {
    setIsResettingPassword(true)
    try {
      await requestPasswordReset()
      toast.success('비밀번호 재설정 이메일이 발송되었습니다.')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '이메일 발송에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast.error('새 이메일을 입력해주세요.')
      return
    }

    setIsChangingEmail(true)
    try {
      await requestEmailChange(newEmail)
      toast.success('이메일 변경 확인 메일이 발송되었습니다.')
      setNewEmail('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '이메일 변경에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setIsChangingEmail(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      // 계정 삭제 전 확인
      const confirmed = window.confirm(
        '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.\n모든 가족 데이터가 삭제됩니다.'
      )
      if (!confirmed) {
        setIsDeletingAccount(false)
        return
      }

      // 현재는 Supabase auth API로는 불가능
      // Admin API가 필요하므로 API 라우트 호출
      const res = await fetch('/api/auth/delete-account', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '계정 삭제에 실패했습니다.')
      }

      toast.success('계정이 삭제되었습니다.')
      // 자동 로그아웃 및 홈으로 이동
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '계정 삭제에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 프로필 섹션 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">프로필</h3>

        {!isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">표시 이름</label>
              <p className="text-sm text-gray-700">아직 설정되지 않음</p>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              표시 이름 설정
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">표시 이름</label>
              <input
                {...register('displayName', { required: '표시 이름을 입력해주세요.' })}
                type="text"
                placeholder="예: 김철수"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
              {errors.displayName && (
                <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || isUpdatingProfile}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  reset()
                }}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* 계정 보안 섹션 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">계정 보안</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-2">현재 이메일</label>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{currentUser?.email}</p>
          </div>

          <div>
            <Button
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
              variant="outline"
              className="w-full"
            >
              {isResettingPassword ? '이메일 발송 중...' : '비밀번호 재설정 요청'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">재설정 링크가 이메일로 발송됩니다.</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <label className="text-xs text-gray-500">새 이메일 주소</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="newemail@example.com"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
            <Button
              onClick={handleEmailChange}
              disabled={isChangingEmail}
              className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
            >
              {isChangingEmail ? '발송 중...' : '변경 요청'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">확인 이메일을 받고 인증해야 변경됩니다.</p>
        </div>
      </section>

      {/* 로그아웃 및 계정 삭제 섹션 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={onSignOut}
            disabled={loading}
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            {loading ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </div>

        {/* 계정 삭제 (위험 구역) */}
        <div className="border-t border-gray-200 pt-4">
          <div className="mb-3">
            <h4 className="font-semibold text-red-600 text-sm mb-2">⚠️ 계정 삭제</h4>
            <p className="text-xs text-gray-600">
              계정을 삭제하면 모든 데이터가 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              계정 삭제
            </Button>
          ) : (
            <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-semibold">정말로 삭제하시겠습니까?</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeletingAccount ? '삭제 중...' : '확실히 삭제'}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingAccount}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
