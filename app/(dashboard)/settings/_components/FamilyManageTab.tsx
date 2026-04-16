'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  updateFamily,
  inviteFamilyMember,
  removeFamilyMember,
  cancelFamilyInvitation,
  resendFamilyInvitation,
  addExistingMemberToFamily,
} from '@/lib/actions/family.actions'
import { inviteMemberSchema, familyUpdateSchema, type InviteMemberInput, type FamilyUpdateInput } from '@/schemas/album.schema'
import { AddExistingMemberModal } from '@/components/modals/AddExistingMemberModal'
import { Button } from '@/components/ui/button'

interface Family {
  id: string
  owner_id: string
  name?: string
  description?: string
  created_at: string
}

interface FamilyMember {
  id: string
  user_id: string | null
  email: string
  role: 'owner' | 'member'
  invited_at: string
  joined_at?: string | null
}

interface FamilyManageTabProps {
  family: Family | null
  members: FamilyMember[]
  currentUserId: string | null
  onUpdate: () => void
}

export function FamilyManageTab({ family, members, currentUserId, onUpdate }: FamilyManageTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)

  // 초대 폼
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
  })

  // 가족 정보 수정 폼
  const {
    register: registerFamily,
    handleSubmit: handleSubmitFamily,
    reset: resetFamily,
    setValue: setValueFamily,
    formState: { errors: familyErrors, isSubmitting: isFamilySubmitting },
  } = useForm<FamilyUpdateInput>({
    resolver: zodResolver(familyUpdateSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // 가족 정보 로드 시 폼 초기값 설정
  useEffect(() => {
    if (family) {
      setValueFamily('name', family.name || '')
      setValueFamily('description', family.description || '')
    }
  }, [family, setValueFamily])

  if (!family) {
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-8 shadow-sm text-center">
        <p className="text-gray-500 text-sm">가족을 선택해주세요.</p>
      </div>
    )
  }

  const joinedMembers = members.filter((m) => m.user_id !== null)
  const pendingMembers = members.filter((m) => m.user_id === null)

  const handleInvite = async (data: InviteMemberInput) => {
    try {
      await inviteFamilyMember({
        familyId: family.id,
        email: data.email,
      })
      toast.success(`✉️ ${data.email}로 초대 링크를 보냈습니다.`)
      reset()
      onUpdate()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '초대 발송에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const confirmed = window.confirm('정말로 이 멤버를 제거하시겠습니까?')
    if (!confirmed) return

    setLoadingMemberId(memberId)
    try {
      await removeFamilyMember(family.id, memberId)
      toast.success('멤버가 제거되었습니다.')
      onUpdate()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '멤버 제거에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setLoadingMemberId(null)
    }
  }

  const handleCancelInvitation = async (email: string) => {
    const confirmed = window.confirm('정말로 초대를 취소하시겠습니까?')
    if (!confirmed) return

    try {
      await cancelFamilyInvitation(family.id, email)
      toast.success('초대가 취소되었습니다.')
      onUpdate()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '초대 취소에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  const handleResendInvitation = async (email: string) => {
    try {
      await resendFamilyInvitation(family.id, email)
      toast.success(`${email}로 초대 링크를 다시 보냈습니다.`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '초대 재전송에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  const handleUpdateFamily = async (data: FamilyUpdateInput) => {
    try {
      await updateFamily({
        familyId: family.id,
        name: data.name || undefined,
        description: data.description || undefined,
      })
      toast.success('가족 정보가 저장되었습니다.')
      setIsEditing(false)
      onUpdate()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '가족 정보 저장에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-4">
      {/* 가족 정보 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">가족 정보</h3>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            className="text-xs"
          >
            {isEditing ? '취소' : '수정'}
          </Button>
        </div>

        {!isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500">가족명</label>
              <p className="text-sm text-gray-700">{family.name || '(설정되지 않음)'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">설명</label>
              <p className="text-sm text-gray-700">{family.description || '(설정되지 않음)'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">가족 ID</label>
              <p className="text-xs text-gray-500 font-mono">{family.id}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">멤버 수</label>
              <p className="text-sm text-gray-700">{members.length}명</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitFamily(handleUpdateFamily)} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">가족명</label>
              <input
                {...registerFamily('name')}
                type="text"
                placeholder="예: 김가족"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
              {familyErrors.name && (
                <p className="mt-1 text-xs text-red-500">{familyErrors.name.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">설명</label>
              <textarea
                {...registerFamily('description')}
                placeholder="가족에 대한 설명"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                rows={3}
              />
              {familyErrors.description && (
                <p className="mt-1 text-xs text-red-500">{familyErrors.description.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isFamilySubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isFamilySubmitting ? '저장 중...' : '저장'}
            </Button>
          </form>
        )}
      </section>

      {/* 가족 멤버 */}
      {joinedMembers.length > 0 && (
        <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">가족 멤버 ({joinedMembers.length})</h3>
          <div className="space-y-2">
            {joinedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{member.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-200">
                      {member.role === 'owner' ? '소유자' : '멤버'}
                    </span>
                    {member.joined_at && (
                      <span className="text-xs text-gray-500">
                        {new Date(member.joined_at).toLocaleDateString('ko-KR')} 가입
                      </span>
                    )}
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <Button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={loadingMemberId === member.id}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs shrink-0"
                  >
                    {loadingMemberId === member.id ? '제거 중...' : '제거'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 초대 대기 중 */}
      {pendingMembers.length > 0 && (
        <section className="rounded-xl bg-white border border-yellow-100 p-5 shadow-sm space-y-4 bg-yellow-50">
          <h3 className="font-semibold text-gray-900">초대 대기 중 ({pendingMembers.length})</h3>
          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg bg-white p-3 border border-yellow-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{member.email}</p>
                  <span className="text-xs text-gray-500 inline-block mt-1">
                    {new Date(member.invited_at).toLocaleDateString('ko-KR')} 초대
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    onClick={() => handleResendInvitation(member.email)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                  >
                    재전송
                  </Button>
                  <Button
                    onClick={() => handleCancelInvitation(member.email)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs"
                  >
                    취소
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 멤버 초대 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">멤버 초대</h3>
        <form onSubmit={handleSubmit(handleInvite)} className="flex gap-2">
          <div className="flex-1">
            <input
              {...register('email')}
              type="email"
              placeholder="example@email.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
          >
            {isSubmitting ? '발송 중...' : '초대'}
          </Button>
        </form>
        <p className="text-xs text-gray-500">이메일로 초대 링크가 발송됩니다.</p>
      </section>

      {/* 기존 회원 추가 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">기존 회원 추가</h3>
        <Button
          onClick={() => setIsAddMemberModalOpen(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          기존 회원 검색 추가
        </Button>
        <p className="text-xs text-gray-500">이미 가입한 회원을 검색하여 추가합니다.</p>
      </section>

      {/* 모달 */}
      <AddExistingMemberModal
        isOpen={isAddMemberModalOpen}
        familyId={family.id}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={onUpdate}
      />
    </div>
  )
}
