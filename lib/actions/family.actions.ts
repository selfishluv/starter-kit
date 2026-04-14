'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 새 가족 생성
 */
export async function createFamily(input: { name?: string }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    const { data, error } = await supabase
      .from('families')
      .insert([
        {
          owner_id: user.id,
          name: input.name || null,
        },
      ])
      .select('id, name, created_at')
      .single()

    if (error) {
      console.error('가족 생성 오류:', error)
      throw new Error('가족 생성에 실패했습니다')
    }

    // ✅ NEW: family_members 테이블에 owner를 추가
    const { error: memberError } = await supabase
      .from('family_members')
      .insert([
        {
          family_id: data.id,
          user_id: user.id,
          email: user.email,
          role: 'owner',
        },
      ])

    if (memberError) {
      console.error('가족 멤버 추가 오류:', memberError)
      // 멤버 추가 실패해도 family는 생성됨, 경고만 하고 계속
    }

    return data
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '가족 생성에 실패했습니다'
    console.error('가족 생성 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * Magic Link 초대 이메일 발송
 * 가족 멤버를 초대하고 이메일로 Magic Link 전송
 */
export async function inviteFamilyMember(input: {
  familyId: string
  email: string
  redirectUrl?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // ✅ NEW: Magic Link URL에 familyId와 inviteEmail 파라미터 추가
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const emailRedirectTo = `${baseUrl}/auth/callback?next=/settings&familyId=${input.familyId}&inviteEmail=${encodeURIComponent(input.email)}`

    // Magic Link로 로그인 링크 발송
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    })

    if (error) {
      console.error('Magic Link 발송 오류:', error)
      throw new Error('이메일 발송에 실패했습니다')
    }

    // 초대 기록: family_members 테이블에 pending 상태로 추가
    const { error: insertError } = await supabase
      .from('family_members')
      .insert([
        {
          family_id: input.familyId,
          email: input.email,
          user_id: null, // 아직 가입하지 않음
          role: 'member',
          invited_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertError && insertError.code !== '23505') {
      // 23505 = UNIQUE violation (이미 초대됨) - 무시
      console.error('초대 기록 저장 오류:', insertError)
    }

    return { success: true, email: input.email }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '초대 발송에 실패했습니다'
    console.error('초대 발송 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 가족 정보 수정
 */
export async function updateFamily(input: {
  familyId: string
  name?: string
  description?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // 현재 사용자가 가족 소유자인지 확인
    const { data: family, error: checkError } = await supabase
      .from('families')
      .select('owner_id')
      .eq('id', input.familyId)
      .single()

    if (checkError || !family || family.owner_id !== user.id) {
      throw new Error('권한이 없습니다')
    }

    // 가족 정보 업데이트
    const { data, error } = await supabase
      .from('families')
      .update({
        name: input.name || null,
        description: input.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.familyId)
      .select()
      .single()

    if (error) {
      console.error('가족 정보 수정 오류:', error)
      throw new Error('가족 정보 수정에 실패했습니다')
    }

    return data
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '가족 정보 수정에 실패했습니다'
    console.error('가족 정보 수정 오류:', err)
    throw new Error(errorMessage)
  }
}
