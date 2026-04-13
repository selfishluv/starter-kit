'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/gallery', label: '갤러리', icon: '📸' },
  { href: '/albums', label: '앨범', icon: '📁' },
  { href: '/settings', label: '설정', icon: '⚙️' },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-rose-100 bg-white/90 backdrop-blur-sm sm:hidden">
      <div className="flex h-16 items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive
                  ? 'text-rose-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={cn('font-medium', isActive && 'text-rose-600')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}