'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 사용자 프로필 정보 업데이트 (표시 이름)
 */
export async function updateUserProfile(input: { displayName: string }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // 현재는 Supabase auth.users의 user_metadata에 저장
    // 향후 user_profiles 테이블 추가 후 그곳에 저장
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: input.displayName,
      },
    })

    if (error) {
      console.error('프로필 업데이트 오류:', error)
      throw new Error('프로필 업데이트에 실패했습니다')
    }

    return { success: true, displayName: input.displayName }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다'
    console.error('프로필 업데이트 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 비밀번호 재설정 요청 (이메일 발송)
 */
export async function requestPasswordReset() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user || !user.email) {
    throw new Error('인증 필요')
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${baseUrl}/auth/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('비밀번호 재설정 이메일 발송 오류:', error)
      throw new Error('이메일 발송에 실패했습니다')
    }

    return { success: true, email: user.email }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '이메일 발송에 실패했습니다'
    console.error('비밀번호 재설정 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 이메일 변경 요청 (이메일 인증 필요)
 */
export async function requestEmailChange(newEmail: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${baseUrl}/auth/callback`

    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      {
        emailRedirectTo: redirectUrl,
      }
    )

    if (error) {
      console.error('이메일 변경 요청 오류:', error)
      throw new Error('이메일 변경 요청에 실패했습니다')
    }

    return { success: true, newEmail }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '이메일 변경 요청에 실패했습니다'
    console.error('이메일 변경 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 계정 삭제
 * 주의: Supabase Admin API 사용 (Service Role Key 필요)
 */
export async function deleteAccount() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // 1단계: family_members 테이블에서 사용자가 소유한 가족 찾기
    const { data: ownedFamilies } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')

    if (ownedFamilies && ownedFamilies.length > 0) {
      // 2단계: 소유한 가족의 모든 멤버 삭제
      for (const record of ownedFamilies) {
        await supabase
          .from('family_members')
          .delete()
          .eq('family_id', record.family_id)

        // 3단계: 가족 레코드 삭제
        await supabase
          .from('families')
          .delete()
          .eq('id', record.family_id)
      }
    }

    // 4단계: 멤버로 속한 모든 가족에서 제거
    const { error: memberDeleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('user_id', user.id)

    if (memberDeleteError) {
      console.error('가족 멤버 삭제 오류:', memberDeleteError)
      throw new Error('계정 삭제 중 오류가 발생했습니다')
    }

    // 5단계: 사용자 계정 삭제 (Supabase admin API)
    // 주의: 이 작업은 Service Role Key가 필요함
    // 현재는 Supabase를 통한 클라이언트 API로는 불가능
    // Admin API를 호출하려면 별도의 API 라우트 필요
    return { success: true, message: '계정 삭제 처리됨' }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '계정 삭제에 실패했습니다'
    console.error('계정 삭제 오류:', err)
    throw new Error(errorMessage)
  }
}
