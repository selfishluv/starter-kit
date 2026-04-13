import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-40 h-14 border-b border-rose-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">📸</span>
          <span className="font-semibold text-rose-600">아이 앨범</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <Link
              href="/gallery"
              className="text-sm text-gray-600 hover:text-rose-600 transition-colors hidden sm:block"
            >
              갤러리
            </Link>
            <Link
              href="/albums"
              className="text-sm text-gray-600 hover:text-rose-600 transition-colors hidden sm:block"
            >
              앨범
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-600 hover:text-rose-600 transition-colors hidden sm:block"
            >
              설정
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}