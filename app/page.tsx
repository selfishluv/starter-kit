import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그인 상태면 대시보드로, 아니면 로그인 페이지로
  if (user) {
    redirect('/gallery')
  } else {
    redirect('/login')
  }
}
