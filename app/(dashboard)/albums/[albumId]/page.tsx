'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAlbum } from '@/hooks/useAlbums'
import { PhotoGrid } from '@/components/photo/PhotoGrid'
import { PhotoTimeline } from '@/components/photo/PhotoTimeline'
import { PhotoDetailModal } from '@/components/photo/PhotoDetailModal'
import { PhotoUploadDropzone } from '@/components/photo/PhotoUploadDropzone'
import { GalleryViewToggle } from '@/components/gallery/GalleryViewToggle'
import { useGalleryStore } from '@/hooks/useGalleryStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'

export default function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const { data: album, isPending } = useAlbum(albumId)
  const { viewMode } = useGalleryStore()
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Link href="/albums" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← 앨범
        </Link>
        <span className="text-gray-300">/</span>
        {isPending ? (
          <Skeleton className="h-6 w-32" />
        ) : (
          <h1 className="text-xl font-bold text-gray-900">{album?.name}</h1>
        )}
      </div>

      {album?.description && (
        <p className="text-sm text-gray-500">{album.description}</p>
      )}

      {/* 컨트롤 */}
      <div className="flex items-center justify-between">
        <GalleryViewToggle />
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
        >
          <span>+</span> 업로드
        </button>
      </div>

      {/* 사진 목록 */}
      {viewMode === 'grid' ? (
        <PhotoGrid albumId={albumId} />
      ) : (
        <PhotoTimeline albumId={albumId} />
      )}

      {/* 사진 상세 모달 */}
      <PhotoDetailModal />

      {/* 업로드 시트 */}
      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>사진 업로드</SheetTitle>
          </SheetHeader>
          <PhotoUploadDropzone
            albumId={albumId}
            onSuccess={() => setUploadOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}