'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createFamily, leaveFamily, dissolveFamily } from '@/lib/actions/family.actions'
import { Button } from '@/components/ui/button'

interface Family {
  id: string
  owner_id: string
  name?: string
  description?: string
  created_at: string
  role?: 'owner' | 'member'
}

interface FamilyTabProps {
  families: Family[]
  currentUserId: string | null
  onFamilyCreated: () => void
  onFamilyLeft: () => void
}

export function FamilyTab({ families, currentUserId, onFamilyCreated, onFamilyLeft }: FamilyTabProps) {
  const [isCreatingFamily, setIsCreatingFamily] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [familyToDelete, setFamilyToDelete] = useState<string | null>(null)
  const [isDeletingFamily, setIsDeletingFamily] = useState(false)

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) {
      toast.error('가족명을 입력해주세요.')
      return
    }

    setIsCreatingFamily(true)
    try {
      await createFamily({ name: newFamilyName })
      toast.success(`${newFamilyName} 가족이 생성되었습니다.`)
      setNewFamilyName('')
      onFamilyCreated()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '가족 생성에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setIsCreatingFamily(false)
    }
  }

  const handleLeaveFamily = async (familyId: string) => {
    const confirmed = window.confirm('정말로 이 가족에서 탈퇴하시겠습니까?')
    if (!confirmed) return

    try {
      await leaveFamily(familyId)
      toast.success('가족에서 탈퇴했습니다.')
      onFamilyLeft()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '가족 탈퇴에 실패했습니다.'
      toast.error(errorMessage)
    }
  }

  const handleDissolveFamily = async (familyId: string) => {
    const confirmed = window.confirm(
      '정말로 이 가족을 완전히 해산하시겠습니까?\n모든 멤버가 제거되고 앨범이 삭제될 수 있습니다.'
    )
    if (!confirmed) return

    setIsDeletingFamily(true)
    try {
      await dissolveFamily(familyId)
      toast.success('가족이 해산되었습니다.')
      setFamilyToDelete(null)
      onFamilyLeft()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '가족 해산에 실패했습니다.'
      toast.error(errorMessage)
    } finally {
      setIsDeletingFamily(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 새 가족 생성 */}
      <section className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">새 가족 만들기</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            placeholder="예: 김가족"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFamily()
              }
            }}
          />
          <Button
            onClick={handleCreateFamily}
            disabled={isCreatingFamily}
            className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
          >
            {isCreatingFamily ? '생성 중...' : '생성'}
          </Button>
        </div>
      </section>

      {/* 소속 가족 목록 */}
      {families.length > 0 ? (
        <section className="space-y-3">
          {families.map((family) => {
            const isOwner = currentUserId === family.owner_id
            const role = family.role || 'member'

            return (
              <div
                key={family.id}
                className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {family.name || '(가족명 없음)'}
                    </h4>
                    {family.description && (
                      <p className="text-sm text-gray-600 mt-1">{family.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {isOwner ? '소유자' : '멤버'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(family.created_at).toLocaleDateString('ko-KR')} 생성
                      </span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="border-t border-gray-200 pt-3 flex gap-2">
                  {isOwner ? (
                    // owner용 버튼
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={isDeletingFamily}
                      >
                        관리하기
                      </Button>
                      {familyToDelete === family.id ? (
                        <Button
                          onClick={() => handleDissolveFamily(family.id)}
                          disabled={isDeletingFamily}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          {isDeletingFamily ? '해산 중...' : '확실히 해산'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setFamilyToDelete(family.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          해산
                        </Button>
                      )}
                    </>
                  ) : (
                    // member용 버튼
                    <Button
                      onClick={() => handleLeaveFamily(family.id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      탈퇴
                    </Button>
                  )}
                </div>

                {/* 해산 확인 */}
                {familyToDelete === family.id && isOwner && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <p className="font-semibold mb-2">정말로 해산하시겠습니까?</p>
                    <p className="text-xs mb-3">모든 멤버가 제거되고 관련 데이터가 삭제됩니다.</p>
                    <Button
                      onClick={() => setFamilyToDelete(null)}
                      variant="outline"
                      className="w-full"
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 p-8 shadow-sm text-center">
          <p className="text-gray-500 text-sm">소속된 가족이 없습니다.</p>
          <p className="text-gray-500 text-xs mt-2">위에서 새 가족을 만들거나 초대받은 링크를 확인하세요.</p>
        </div>
      )}
    </div>
  )
}
