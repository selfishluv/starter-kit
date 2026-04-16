'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountTab } from './_components/AccountTab'
import { FamilyTab } from './_components/FamilyTab'
import { FamilyManageTab } from './_components/FamilyManageTab'

interface Family {
  id: string
  owner_id: string
  name?: string
  description?: string
  created_at: string
  role?: 'owner' | 'member'
}

interface FamilyMember {
  id: string
  user_id: string | null
  email: string
  role: 'owner' | 'member'
  invited_at: string
  joined_at?: string | null
}

interface CurrentUser {
  email: string
  created_at: string
  last_sign_in_at?: string
  id: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(true)
  const [families, setFamilies] = useState<Family[]>([])
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'member' | null>(null)
  const supabase = createClient()

  // 초기 로드
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email ?? '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        })
      }
      setUserLoading(false)

      // 가족 목록 로드
      await loadFamilies()
    } catch (err) {
      console.error('초기 데이터 로드 오류:', err)
      toast.error('정보를 불러올 수 없습니다.')
      setUserLoading(false)
    }
  }

  const loadFamilies = async () => {
    try {
      const res = await fetch('/api/families')
      if (!res.ok) throw new Error('가족 목록 조회 실패')
      const data = await res.json()
      setFamilies(data.families || [])

      // 첫 번째 가족을 기본값으로 선택
      if (data.families && data.families.length > 0) {
        await loadFamily(data.families[0].id)
      }
    } catch (err) {
      console.error('가족 목록 로드 오류:', err)
    }
  }

  const loadFamily = async (familyId: string) => {
    try {
      const res = await fetch(`/api/family/${familyId}`)
      if (!res.ok) throw new Error('가족 정보 조회 실패')
      const data = await res.json()
      setCurrentFamily(data.family)
      setFamilyMembers(data.members || [])

      // 현재 사용자의 role 확인
      if (currentUser) {
        const member = data.members?.find((m: FamilyMember) => m.user_id === currentUser.id)
        setCurrentUserRole(member?.role || null)
      }
    } catch (err) {
      console.error('가족 정보 로드 오류:', err)
    }
  }

  const handleFamilyChange = (familyId: string) => {
    loadFamily(familyId)
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '로그아웃에 실패했습니다.'
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">설정</h1>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="account">내 계정</TabsTrigger>
          <TabsTrigger value="family">내 가족</TabsTrigger>
          {currentUserRole === 'owner' && <TabsTrigger value="manage">가족 관리</TabsTrigger>}
        </TabsList>

        {/* 탭 1: 내 계정 */}
        <TabsContent value="account" className="space-y-4">
          <AccountTab
            currentUser={currentUser}
            loading={loading}
            onSignOut={handleSignOut}
          />
        </TabsContent>

        {/* 탭 2: 내 가족 */}
        <TabsContent value="family" className="space-y-4">
          {families.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-3 mb-4">
              <label className="text-sm font-semibold text-gray-900">현재 가족</label>
              <select
                value={currentFamily?.id || ''}
                onChange={(e) => handleFamilyChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              >
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || '(가족명 없음)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <FamilyTab
            families={families}
            currentUserId={currentUser?.id || null}
            onFamilyCreated={loadFamilies}
            onFamilyLeft={loadFamilies}
          />
        </TabsContent>

        {/* 탭 3: 가족 관리 (owner만) */}
        {currentUserRole === 'owner' && (
          <TabsContent value="manage" className="space-y-4">
            {families.length > 0 && (
              <div className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-3 mb-4">
                <label className="text-sm font-semibold text-gray-900">관리할 가족</label>
                <select
                  value={currentFamily?.id || ''}
                  onChange={(e) => handleFamilyChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || '(가족명 없음)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <FamilyManageTab
              family={currentFamily}
              members={familyMembers}
              currentUserId={currentUser?.id || null}
              onUpdate={() => {
                if (currentFamily) {
                  loadFamily(currentFamily.id)
                }
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* 정보 섹션 */}
      {currentUser && (
        <div className="mt-8 rounded-xl bg-gray-50 border border-gray-100 p-5 shadow-sm space-y-2 text-xs text-gray-600">
          <div>
            <span className="font-semibold">이메일:</span> {currentUser.email}
          </div>
          <div>
            <span className="font-semibold">가입일:</span>{' '}
            {new Date(currentUser.created_at).toLocaleDateString('ko-KR')}
          </div>
          {currentUser.last_sign_in_at && (
            <div>
              <span className="font-semibold">마지막 로그인:</span>{' '}
              {new Date(currentUser.last_sign_in_at).toLocaleDateString('ko-KR')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
