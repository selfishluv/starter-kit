export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          아이 앨범 관리 시작하기
        </h1>
        <p className="text-lg text-gray-600">
          소중한 순간들을 기록하고 가족과 함께 공유해보세요.
        </p>

        <div className="pt-6 space-y-3">
          <a
            href="/login"
            className="block w-full px-6 py-3 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors"
          >
            로그인
          </a>
          <a
            href="/login"
            className="block w-full px-6 py-3 bg-white text-rose-500 font-medium border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
          >
            회원가입
          </a>
        </div>

        <p className="text-sm text-gray-500 pt-4">
          Supabase를 사용하여 안전하게 관리됩니다.
        </p>
      </div>
    </main>
  )
}
