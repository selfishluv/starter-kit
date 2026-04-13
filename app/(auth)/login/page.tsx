import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="text-5xl">📸</div>
          <h1 className="text-2xl font-bold text-gray-900">아이 앨범</h1>
          <p className="text-sm text-gray-500">
            소중한 순간들을 가족과 함께 공유하세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <LoginForm />
      </div>
    </main>
  )
}