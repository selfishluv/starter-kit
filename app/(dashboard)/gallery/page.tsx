'use client'

import { useState } from 'react'
import { PhotoGrid } from '@/components/photo/PhotoGrid'
import { PhotoTimeline } from '@/components/photo/PhotoTimeline'
import { PhotoDetailModal } from '@/components/photo/PhotoDetailModal'
import { PhotoUploadDropzone } from '@/components/photo/PhotoUploadDropzone'
import { GalleryViewToggle } from '@/components/gallery/GalleryViewToggle'
import { useGalleryStore } from '@/hooks/useGalleryStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const DEFAULT_ALBUM_ID = 'default'

export default function GalleryPage() {
  const { viewMode } = useGalleryStore()
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">전체 갤러리</h1>
        <div className="flex items-center gap-2">
          <GalleryViewToggle />
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
          >
            <span>+</span> 업로드
          </button>
        </div>
      </div>

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
          <PhotoUploadDropzone
            albumId={DEFAULT_ALBUM_ID}
            onSuccess={() => setUploadOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}