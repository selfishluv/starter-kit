import { createClient } from '@/lib/supabase/server'

/**
 * 현재 사용자 프로필 정보 조회
 */
export async function getUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증 필요')
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.user_metadata?.display_name || user.user_metadata?.name || '',
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
  }
}
