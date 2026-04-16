'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

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

/**
 * 사용자가 속한 모든 가족 목록 조회
 */
export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const res = await fetch('/api/families')
      if (!res.ok) throw new Error('가족 목록 조회 실패')
      const data = await res.json()
      return data.families as Family[]
    },
  })
}

/**
 * 현재 사용자의 첫 번째 가족 ID 조회
 */
export function useCurrentFamilyId() {
  return useQuery({
    queryKey: ['currentFamilyId'],
    queryFn: async () => {
      const res = await fetch('/api/family/me')
      if (!res.ok) throw new Error('가족 ID 조회 실패')
      const data = await res.json()
      return data.familyId as string | null
    },
  })
}

/**
 * 특정 가족 상세 정보 및 멤버 조회
 */
export function useFamily(familyId?: string) {
  return useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      if (!familyId) throw new Error('familyId가 필요합니다')
      const res = await fetch(`/api/family/${familyId}`)
      if (!res.ok) throw new Error('가족 정보 조회 실패')
      const data = await res.json()
      return data as { family: Family; members: FamilyMember[] }
    },
    enabled: !!familyId,
  })
}

/**
 * 가족 멤버 목록 조회
 */
export function useFamilyMembers(familyId?: string) {
  const { data: familyData } = useFamily(familyId)
  return familyData?.members || []
}

/**
 * 현재 사용자의 특정 가족 내 역할 조회
 */
export function useCurrentUserRole(familyId?: string) {
  const { data: familyData } = useFamily(familyId)
  const supabase = createClient()

  return useQuery({
    queryKey: ['currentUserRole', familyId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const member = familyData?.members?.find((m) => m.user_id === user.id)
      return member?.role || null
    },
    enabled: !!familyId && !!familyData,
  })
}
