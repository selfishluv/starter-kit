import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white sm:bg-gradient-to-br sm:from-purple-50 sm:via-pink-50 sm:to-orange-50 px-4">
      <div className="w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          {/* 그라디언트 배경 카메라 아이콘 */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 mb-4 shadow-lg">
            <span className="text-3xl">📸</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">아이 앨범</h1>
          <p className="text-sm text-gray-500 mt-2">
            소중한 순간들을 가족과 함께
          </p>
        </div>

        {/* 로그인 카드 */}
        <Card className="border-0 shadow-none sm:border sm:shadow-lg">
          <CardContent className="p-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}