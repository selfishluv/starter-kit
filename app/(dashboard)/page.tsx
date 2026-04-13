import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요 👋</h1>
        <p className="text-gray-500 mt-1">오늘도 소중한 순간을 기록해보세요.</p>
      </div>

      {/* 빠른 이동 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Link
          href="/gallery"
          className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white border border-rose-100 p-6 hover:bg-rose-50 transition-colors shadow-sm"
        >
          <span className="text-3xl">📸</span>
          <span className="text-sm font-medium text-gray-700">전체 갤러리</span>
        </Link>

        <Link
          href="/albums"
          className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white border border-rose-100 p-6 hover:bg-rose-50 transition-colors shadow-sm"
        >
          <span className="text-3xl">📁</span>
          <span className="text-sm font-medium text-gray-700">앨범</span>
        </Link>

        <Link
          href="/settings"
          className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white border border-rose-100 p-6 hover:bg-rose-50 transition-colors shadow-sm col-span-2 sm:col-span-1"
        >
          <span className="text-3xl">👨‍👩‍👧</span>
          <span className="text-sm font-medium text-gray-700">가족 공유</span>
        </Link>
      </div>

      {/* 안내 */}
      <div className="rounded-xl bg-rose-50 border border-rose-100 p-5 text-sm text-rose-700 space-y-2">
        <p className="font-semibold">시작하기</p>
        <ol className="list-decimal list-inside space-y-1 text-rose-600">
          <li>앨범에서 새 앨범을 만드세요</li>
          <li>갤러리에서 사진을 업로드하세요</li>
          <li>설정에서 가족을 초대하세요</li>
        </ol>
      </div>
    </div>
  )
}