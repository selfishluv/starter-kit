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
 * Magic Link 초대 이메일 발송 (owner만 가능)
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
    // 현재 사용자가 이 가족의 owner인지 확인
    const { data: ownerCheck, error: ownerCheckError } = await supabase
      .from('family_members')
      .select('id, role')
      .eq('family_id', input.familyId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (ownerCheckError || !ownerCheck) {
      throw new Error('멤버를 초대할 권한이 없습니다')
    }

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
      // 더 상세한 오류 메시지 제공
      const errorDetail = error.message || '알 수 없는 오류'
      throw new Error(`이메일 발송에 실패했습니다: ${errorDetail}`)
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

    return { success: true, email: input.email, method: 'invite' }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '초대 발송에 실패했습니다'
    console.error('초대 발송 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 가족 멤버 제거 (owner만 가능)
 */
export async function removeFamilyMember(familyId: string, memberId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // 현재 사용자가 이 가족의 owner인지 확인
    const { data: memberCheck, error: memberCheckError } = await supabase
      .from('family_members')
      .select('id, role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (memberCheckError || !memberCheck) {
      throw new Error('멤버를 제거할 권한이 없습니다')
    }

    // 제거할 멤버 조회
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('id', memberId)
      .eq('family_id', familyId)
      .single()

    if (memberError || !member) {
      throw new Error('멤버를 찾을 수 없습니다')
    }

    // owner는 제거 불가
    if (member.role === 'owner') {
      throw new Error('소유자는 제거할 수 없습니다')
    }

    // 멤버 삭제
    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId)
      .eq('family_id', familyId)

    if (deleteError) {
      console.error('멤버 제거 오류:', deleteError)
      throw new Error('멤버 제거에 실패했습니다')
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '멤버 제거에 실패했습니다'
    console.error('멤버 제거 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 초대 취소 (pending 상태의 초대 삭제)
 */
export async function cancelFamilyInvitation(familyId: string, email: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // 현재 사용자가 이 가족의 멤버인지 확인
    const { data: memberCheck, error: memberCheckError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single()

    if (memberCheckError || !memberCheck) {
      throw new Error('이 가족에 접근할 수 없습니다')
    }

    // pending 초대 삭제 (user_id IS NULL)
    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('email', email)
      .is('user_id', null)

    if (deleteError) {
      console.error('초대 취소 오류:', deleteError)
      throw new Error('초대 취소에 실패했습니다')
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '초대 취소에 실패했습니다'
    console.error('초대 취소 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 초대 재전송 (Magic Link 재발송)
 */
export async function resendFamilyInvitation(familyId: string, email: string) {
  // 기존 inviteFamilyMember 로직 재사용
  return inviteFamilyMember({
    familyId,
    email,
  })
}

/**
 * 기존 회원을 가족에 추가 (이메일 발송 없음)
 */
export async function addExistingMemberToFamily(
  familyId: string,
  email: string
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  console.log('addExistingMemberToFamily', user, '\nfamilyId : ', familyId, "\nemail : ",email)

  try {
    // 현재 사용자가 이 가족의 멤버인지 확인
    const { data: memberCheck, error: memberCheckError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single()

    if (memberCheckError || !memberCheck) {
      throw new Error('이 가족에 접근할 수 없습니다')
    }

    // 해당 이메일의 user_id 찾기
    const { data: member } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('email', email)
      .not('user_id', 'is', null)
      .limit(1)
      .single()

    if (!member?.user_id) {
      throw new Error('등록된 회원을 찾을 수 없습니다')
    }

    // 가족에 추가
    const { error: upsertError } = await supabase
      .from('family_members')
      .upsert(
        [
          {
            family_id: familyId,
            user_id: member.user_id,
            email,
            role: 'member',
          },
        ],
        { onConflict: 'family_id,user_id', ignoreDuplicates: true }
      )

    if (upsertError && upsertError.code !== '23505') {
      throw upsertError
    }

    return { success: true, email }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '회원 추가에 실패했습니다'
    console.error('회원 추가 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 가족 정보 수정 (owner만 가능)
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
    // 현재 사용자가 이 가족의 owner인지 확인
    const { data: memberCheck, error: memberCheckError } = await supabase
      .from('family_members')
      .select('id, role')
      .eq('family_id', input.familyId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (memberCheckError || !memberCheck) {
      throw new Error('이 가족을 수정할 권한이 없습니다')
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

/**
 * 가족에서 탈퇴 (member만 가능)
 */
export async function leaveFamily(familyId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // 현재 사용자의 가족 멤버십 확인
    const { data: memberRecord, error: memberCheckError } = await supabase
      .from('family_members')
      .select('id, role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single()

    if (memberCheckError || !memberRecord) {
      throw new Error('이 가족에 속하지 않습니다')
    }

    // owner는 탈퇴 불가 (해산해야 함)
    if (memberRecord.role === 'owner') {
      throw new Error('소유자는 가족을 탈퇴할 수 없습니다. 가족을 해산해주세요.')
    }

    // member 삭제
    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberRecord.id)

    if (deleteError) {
      console.error('가족 탈퇴 오류:', deleteError)
      throw new Error('가족 탈퇴에 실패했습니다')
    }

    return { success: true, message: '가족에서 탈퇴했습니다' }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '가족 탈퇴에 실패했습니다'
    console.error('가족 탈퇴 오류:', err)
    throw new Error(errorMessage)
  }
}

/**
 * 가족 해산 (owner만 가능)
 * 모든 멤버를 삭제하고 가족을 완전히 삭제
 */
export async function dissolveFamily(familyId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  try {
    // 현재 사용자가 이 가족의 owner인지 확인
    const { data: ownerCheck, error: ownerCheckError } = await supabase
      .from('family_members')
      .select('id, role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (ownerCheckError || !ownerCheck) {
      throw new Error('가족을 해산할 권한이 없습니다')
    }

    // 1단계: 가족의 모든 앨범 삭제 (선택적 - 앨범 테이블이 있다면)
    // 현재 앨범 삭제는 RLS나 별도 처리 필요

    // 2단계: 가족의 모든 멤버 삭제
    const { error: membersDeleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', familyId)

    if (membersDeleteError) {
      console.error('가족 멤버 삭제 오류:', membersDeleteError)
      throw new Error('가족 해산에 실패했습니다')
    }

    // 3단계: 가족 삭제
    const { error: familyDeleteError } = await supabase
      .from('families')
      .delete()
      .eq('id', familyId)

    if (familyDeleteError) {
      console.error('가족 삭제 오류:', familyDeleteError)
      throw new Error('가족 해산에 실패했습니다')
    }

    return { success: true, message: '가족이 해산되었습니다' }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '가족 해산에 실패했습니다'
    console.error('가족 해산 오류:', err)
    throw new Error(errorMessage)
  }
}
