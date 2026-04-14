'use client'

import { useState, useEffect } from 'react'
import { useAlbums } from '@/hooks/useAlbums'
import { AlbumCard } from '@/components/album/AlbumCard'
import { CreateAlbumDialog } from '@/components/album/CreateAlbumDialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function AlbumsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [familyId, setFamilyId] = useState<string>('')
  const [familyLoading, setFamilyLoading] = useState(true)
  const { data: albums, isPending } = useAlbums(familyId)

  // 서버에서 familyId 가져오기
  useEffect(() => {
    async function getFamilyId() {
      try {
        const res = await fetch('/api/family/me')
        if (!res.ok) throw new Error('가족 정보 조회 실패')
        const data = await res.json()
        setFamilyId(data.familyId)
      } catch (err) {
        console.error('familyId 조회 오류:', err)
      } finally {
        setFamilyLoading(false)
      }
    }
    getFamilyId()
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">앨범</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
        >
          <span>+</span> 새 앨범
        </button>
      </div>

      {/* 앨범 목록 */}
      {familyLoading || isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : albums && albums.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-gray-500 font-medium">앨범이 없습니다</p>
          <p className="text-gray-400 text-sm mt-1">첫 번째 앨범을 만들어보세요!</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
          >
            앨범 만들기
          </button>
        </div>
      )}

      {/* 앨범 생성 모달 */}
      {familyId && (
        <CreateAlbumDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          familyId={familyId}
        />
      )}
    </div>
  )
}