import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const familyId = searchParams.get('familyId')
  const inviteEmail = searchParams.get('inviteEmail')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // ✅ NEW: 세션 교환 후 user_id를 family_members에 업데이트
      if (familyId && inviteEmail) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { error: updateError } = await supabase
            .from('family_members')
            .update({ user_id: user.id })
            .eq('family_id', familyId)
            .eq('email', inviteEmail)
            .is('user_id', null)

          if (updateError) {
            console.error('family_members 업데이트 오류:', updateError)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}