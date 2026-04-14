import { createClient } from '@/lib/supabase/server'

/**
 * 현재 사용자의 가족 ID 조회
 * 없으면 새로 생성
 */
export async function getUserFamilyId(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  // 기존 가족 조회
  const { data: families, error: queryError } = await supabase
    .from('families')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (families && families.id) {
    return families.id
  }

  // 가족이 없으면 생성
  if (queryError && queryError.code === 'PGRST116') {
    const { data: newFamily, error: createError } = await supabase
      .from('families')
      .insert([{ owner_id: user.id }])
      .select('id')
      .single()

    if (createError) {
      console.error('가족 생성 오류:', createError)
      throw new Error('가족 생성에 실패했습니다')
    }

    if (newFamily && newFamily.id) {
      return newFamily.id
    }
  }

  throw new Error('가족 ID를 찾을 수 없습니다')
}

/**
 * 사용자가 소유한 모든 가족 목록 조회
 */
export async function getUserFamilies() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  const { data: families, error } = await supabase
    .from('families')
    .select('id, name, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('가족 목록 조회 오류:', error)
    throw new Error('가족 목록을 불러올 수 없습니다')
  }

  return families || []
}

/**
 * 가족 상세 정보 조회 (멤버 포함)
 */
export async function getFamilyWithMembers(familyId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  // 가족 정보 조회
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('id, owner_id, name, description, created_at')
    .eq('id', familyId)
    .single()

  if (familyError || !family) {
    throw new Error('가족을 찾을 수 없습니다')
  }

  // 가족 멤버 조회
  const { data: members, error: membersError } = await supabase
    .from('family_members')
    .select('id, email, role, joined_at')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true })

  if (membersError) {
    console.error('멤버 조회 오류:', membersError)
  }

  return {
    family,
    members: members || [],
  }
}

