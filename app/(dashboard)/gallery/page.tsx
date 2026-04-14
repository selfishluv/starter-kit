'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PhotoGrid } from '@/components/photo/PhotoGrid'
import { PhotoTimeline } from '@/components/photo/PhotoTimeline'
import { PhotoDetailModal } from '@/components/photo/PhotoDetailModal'
import { PhotoUploadDropzone } from '@/components/photo/PhotoUploadDropzone'
import { GalleryViewToggle } from '@/components/gallery/GalleryViewToggle'
import { useGalleryStore } from '@/hooks/useGalleryStore'
import { useAlbums } from '@/hooks/useAlbums'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'

export default function GalleryPage() {
  const { viewMode } = useGalleryStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('')
  const [familyId, setFamilyId] = useState<string>('')
  const { data: albums, isPending: albumsLoading } = useAlbums(familyId)

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

  // 앨범이 없으면 안내 표시
  const hasNoAlbums = !albumsLoading && (!albums || albums.length === 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">전체 갤러리</h1>
        <div className="flex items-center gap-2">
          <GalleryViewToggle />
          <button
            onClick={() => setUploadOpen(true)}
            disabled={hasNoAlbums}
            className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>+</span> 업로드
          </button>
        </div>
      </div>

      {/* 안내 */}
      {hasNoAlbums && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
          <p className="font-medium mb-2">앨범을 먼저 만들어주세요</p>
          <Link href="/albums" className="inline-block text-blue-600 hover:text-blue-800 underline">
            앨범 관리 페이지에서 새 앨범 만들기
          </Link>
        </div>
      )}

      {/* 갤러리 */}
      {viewMode === 'grid' ? <PhotoGrid /> : <PhotoTimeline />}

      {/* 사진 상세 모달 */}
      <PhotoDetailModal />

      {/* 업로드 시트 */}
      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>사진 업로드</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* 앨범 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                앨범 선택 <span className="text-rose-500">*</span>
              </label>
              {albumsLoading ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : albums && albums.length > 0 ? (
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                >
                  <option value="">앨범을 선택하세요</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">앨범을 먼저 만들어주세요</p>
              )}
            </div>

            {/* 업로드 폼 */}
            {selectedAlbumId && familyId && (
              <PhotoUploadDropzone
                albumId={selectedAlbumId}
                onSuccess={() => {
                  setUploadOpen(false)
                  setSelectedAlbumId('')
                }}
              />
            )}

            {selectedAlbumId === '' && !albumsLoading && (
              <p className="text-center text-sm text-gray-400 py-8">
                앨범을 선택하면 업로드 폼이 나타납니다
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}