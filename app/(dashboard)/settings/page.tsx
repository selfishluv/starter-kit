'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  createFamily,
  inviteFamilyMember,
  updateFamily,
  removeFamilyMember,
  cancelFamilyInvitation,
  resendFamilyInvitation,
  assignUserToFamily,
} from '@/lib/actions/family.actions'
import { inviteMemberSchema, familyUpdateSchema, type InviteMemberInput, type FamilyUpdateInput } from '@/schemas/album.schema'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [familyLoading, setFamilyLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [familiesLoading, setFamiliesLoading] = useState(true)
  const [families, setFamilies] = useState<Array<{ id: string; name?: string; created_at: string }>>([])
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isCreatingFamily, setIsCreatingFamily] = useState(false)
  const supabase = createClient()

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
    },
  })

  // 가족 목록 및 정보 로드
  useEffect(() => {
    async function load() {
      try {
        await loadFamilies()
        await loadFamily()
      } catch (err) {
        console.error('가족 정보 로드 오류:', err)
        toast.error('가족 정보를 불러올 수 없습니다.')
      } finally {
        setFamilyLoading(false)
      }
    }
    load()
  }, [])

  // 가족 정보가 로드되면 폼 초기값 설정
  useEffect(() => {
    if (family) {
      setValueFamily('name', family.name || '')
      setValueFamily('description', family.description || '')
    }
  }, [family, setValueFamily])

  async function onInvite(data: InviteMemberInput) {
    if (!family) {
      toast.error('가족 정보를 먼저 로드해주세요.')
      return
    }

    try {
      await inviteFamilyMember({
        familyId: family.id,
        email: data.email,
      })
      toast.success(
        `✉️ ${data.email}로 초대 링크를 보냈습니다.\n이메일을 확인하면 자동으로 로그인됩니다.`
      )
      reset()
      // 멤버 목록 새로고침
      await loadFamily()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '초대 발송에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!family) return

    try {
      await removeFamilyMember(family.id, memberId)
      toast.success('멤버가 제거되었습니다.')
      await loadFamily()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '멤버 제거에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  async function handleCancelInvitation(email: string) {
    if (!family) return

    try {
      await cancelFamilyInvitation(family.id, email)
      toast.success('초대가 취소되었습니다.')
      await loadFamily()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '초대 취소에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  async function handleResendInvitation(email: string) {
    if (!family) return

    try {
      await resendFamilyInvitation(family.id, email)
      toast.success(`${email}로 초대 링크를 다시 보냈습니다.`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '초대 재전송에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  async function handleAssignUserToFamily(email: string) {
    if (!family) return

    try {
      const result = await assignUserToFamily(family.id, email)
      if (result.method === 'direct') {
        toast.success(`${email} 사용자가 가족에 추가되었습니다.`)
      } else {
        toast.success(`${email}로 초대 링크를 보냈습니다.`)
      }
      reset()
      await loadFamily()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '사용자 추가에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  // 어드민 폼 (회원 가족 직접 할당)
  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    reset: resetAdmin,
    formState: { isSubmitting: isAdminSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
  })

  async function onAssignUser(data: InviteMemberInput) {
    await handleAssignUserToFamily(data.email)
  }

  async function loadFamily() {
    try {
      // familyId 먼저 조회
      const familyRes = await fetch('/api/family/me')
      if (!familyRes.ok) throw new Error('가족 정보 조회 실패')
      const familyData = await familyRes.json()

      // 가족 상세 정보 조회
      const detailRes = await fetch(`/api/family/${familyData.familyId}`)
      if (!detailRes.ok) throw new Error('가족 상세 정보 조회 실패')
      const detailData = await detailRes.json()

      setFamily(detailData.family)
      setMembers(detailData.members)
    } catch (err) {
      console.error('가족 정보 로드 오류:', err)
    }
  }

  async function onUpdateFamily(data: FamilyUpdateInput) {
    if (!family) {
      toast.error('가족 정보를 먼저 로드해주세요.')
      return
    }

    try {
      await updateFamily({
        familyId: family.id,
        name: data.name || undefined,
        description: data.description || undefined,
      })
      toast.success('가족 정보가 저장되었습니다.')
      setIsEditing(false)
      await loadFamily()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '가족 정보 저장에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  async function loadFamilies() {
    try {
      const res = await fetch('/api/families')
      if (!res.ok) throw new Error('가족 목록 조회 실패')
      const data = await res.json()
      setFamilies(data.families)
    } catch (err) {
      console.error('가족 목록 로드 오류:', err)
    } finally {
      setFamiliesLoading(false)
    }
  }

  async function handleCreateFamily() {
    try {
      setIsCreatingFamily(true)
      const newFamily = await createFamily({ name: '새 가족' })
      toast.success('새 가족이 생성되었습니다.')
      await loadFamilies()
      // 새로 생성된 가족으로 이동
      setFamily(newFamily as Family)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '가족 생성에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setIsCreatingFamily(false)
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

      {/* 가족 선택 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">내 가족</h2>
          <button
            onClick={handleCreateFamily}
            disabled={isCreatingFamily}
            className="text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {isCreatingFamily ? '생성 중...' : '+ 새 가족'}
          </button>
        </div>

        {familiesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : families.length > 0 ? (
          <div className="space-y-2">
            {families.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFamily(f as Family)
                  setIsEditing(false)
                }}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  family?.id === f.id
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-100 bg-gray-50 hover:border-rose-200'
                }`}
              >
                <p className="font-medium text-gray-900">{f.name || '이름 없는 가족'}</p>
                <p className="text-xs text-gray-400">
                  {new Date(f.created_at).toLocaleDateString('ko-KR')}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">가족이 없습니다</p>
        )}
      </section>

      {/* 가족 정보 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">가족 정보</h2>
          {!familyLoading && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              수정
            </button>
          )}
        </div>

        {familyLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : family ? (
          isEditing ? (
            // 편집 모드
            <form onSubmit={handleSubmitFamily(onUpdateFamily)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가족명 (선택)
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가족 소개 (선택)
                </label>
                <textarea
                  {...registerFamily('description')}
                  placeholder="가족에 대한 간단한 소개를 작성해주세요"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none"
                />
                {familyErrors.description && (
                  <p className="mt-1 text-xs text-red-500">{familyErrors.description.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    resetFamily()
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isFamilySubmitting}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                >
                  {isFamilySubmitting ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          ) : (
            // 보기 모드
            <div className="space-y-3 text-sm">
              {family.name && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">가족명</p>
                  <p className="text-gray-700 font-medium">{family.name}</p>
                </div>
              )}
              {family.description && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">가족 소개</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{family.description}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 text-xs mb-1">가족 ID</p>
                <p className="font-mono text-gray-700 text-xs break-all">{family.id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">생성일</p>
                <p className="text-gray-700">
                  {new Date(family.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">멤버 수</p>
                <p className="text-gray-700">{members.length}명</p>
              </div>
            </div>
          )
        ) : null}
      </section>

      {/* 가족 멤버 - joined만 표시 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">가족 멤버</h2>

        {familyLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (() => {
          const joinedMembers = members.filter((m) => m.user_id !== null)
          return joinedMembers.length > 0 ? (
            <div className="space-y-2">
              {joinedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm"
                >
                  <div className="flex-1">
                    <p className="text-gray-900">{member.email}</p>
                    <p className="text-xs text-gray-400">
                      {member.role === 'owner' ? '소유자' : '멤버'}
                      {member.joined_at && ` · ${new Date(member.joined_at).toLocaleDateString('ko-KR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' && (
                      <span className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-full">
                        소유자
                      </span>
                    )}
                    {member.role === 'member' && family?.owner_id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        제거
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">멤버가 없습니다</p>
          )
        })()}
      </section>

      {/* 초대 대기 중 (pending) */}
      {(() => {
        const pendingMembers = members.filter((m) => m.user_id === null)
        return pendingMembers.length > 0 ? (
          <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">초대 대기 중</h2>
            <div className="space-y-2">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-sm"
                >
                  <div>
                    <p className="text-gray-900">{member.email}</p>
                    <p className="text-xs text-gray-400">
                      초대됨 · {new Date(member.invited_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleResendInvitation(member.email)}
                      className="text-xs text-blue-500 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-50"
                    >
                      재전송
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(member.email)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null
      })()}

      {/* 가족 멤버 초대 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">가족 멤버 초대</h2>
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

      {/* 어드민: 회원 가족 직접 할당 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">회원 가족 배정</h2>
          <p className="text-sm text-gray-500 mt-1">
            이미 가입한 회원을 이 가족에 직접 추가합니다.
          </p>
        </div>

        <form onSubmit={handleSubmitAdmin(onAssignUser)} className="flex gap-2">
          <div className="flex-1">
            <input
              {...registerAdmin('email')}
              type="email"
              placeholder="member@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <Button
            type="submit"
            disabled={isAdminSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
          >
            추가
          </Button>
        </form>
      </section>

      {/* 계정 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">계정</h2>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full border-red-200 text-red-500 hover:bg-red-50"
          >
            {loading ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </div>
      </section>
    </div>
  )
}
