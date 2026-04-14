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
    // 기존 가족이 있으면 family_members에 upsert (없을 경우만 삽입)
    const { error: memberError } = await supabase
      .from('family_members')
      .upsert(
        [{ family_id: families.id, user_id: user.id, email: user.email, role: 'owner' }],
        { onConflict: 'family_id,user_id', ignoreDuplicates: true }
      )

    if (memberError) {
      console.error('기존 가족의 멤버 추가 오류:', memberError)
      // 멤버 추가 실패해도 family ID는 반환
    }

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
      // ✅ NEW: family_members 테이블에 owner를 추가
      const { error: memberError } = await supabase
        .from('family_members')
        .insert([
          {
            family_id: newFamily.id,
            user_id: user.id,
            email: user.email,
            role: 'owner',
          },
        ])

      if (memberError) {
        console.error('가족 멤버 추가 오류:', memberError)
        // 멤버 추가 실패해도 family는 생성됨, 경고만 하고 계속
      }

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
 * 권한 검증: 사용자가 해당 가족의 멤버인지 확인
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

  // 사용자가 해당 family의 멤버인지 확인 (권한 검증)
  const { data: member, error: memberCheckError } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .single()

  if (memberCheckError || !member) {
    throw new Error('이 가족에 접근할 수 없습니다')
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
    .select('id, user_id, email, role, invited_at, joined_at')
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

/**
 * 기존 회원 검색 (user_id가 있는 회원만)
 * 이메일로 검색하여 이미 가입한 사용자를 찾음
 */
export async function searchExistingMembers(email: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('email, user_id, invited_at')
      .eq('email', email)
      .not('user_id', 'is', null)
      .limit(5)

    if (error) {
      console.error('회원 검색 오류:', error)
      return []
    }

    if (!data) return []

    // 중복 제거 (같은 user_id는 여러 가족에 속할 수 있음)
    const uniqueMembers = Array.from(
      new Map(data.map((m) => [m.user_id, m])).values()
    )

    return uniqueMembers.map((m) => ({
      email: m.email,
      user_id: m.user_id,
      created_at: m.invited_at,
    }))
  } catch (err) {
    console.error('회원 검색 중 오류:', err)
    return []
  }
}
