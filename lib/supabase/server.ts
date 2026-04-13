import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // 서버 컴포넌트에서 쿠키 설정 실패 시 무시
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // 서버 컴포넌트에서 쿠키 삭제 실패 시 무시
          }
        },
      },
    }
  )
}
