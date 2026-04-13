'use client'

import Image from 'next/image'
import { getThumbnailUrl } from '@/lib/supabase/storage'
import { useGalleryStore } from '@/hooks/useGalleryStore'
import { cn } from '@/lib/utils'
import type { Photo } from '@/types/photo'

interface PhotoCardProps {
  photo: Photo
  size?: 'sm' | 'md'
}

export function PhotoCard({ photo, size = 'md' }: PhotoCardProps) {
  const { selectedPhotos, togglePhotoSelection, setSelectedPhotoId, setDetailModalOpen } =
    useGalleryStore()

  const isSelected = selectedPhotos.has(photo.id)
  const thumbnailUrl = getThumbnailUrl(photo.storage_path, size === 'sm' ? 'sm' : 'md')

  function handleClick() {
    // 다중 선택 중이면 선택 토글, 아니면 상세 모달 열기
    if (selectedPhotos.size > 0) {
      togglePhotoSelection(photo.id)
    } else {
      setSelectedPhotoId(photo.id)
      setDetailModalOpen(true)
    }
  }

  function handleLongPress(e: React.MouseEvent) {
    e.preventDefault()
    togglePhotoSelection(photo.id)
  }

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleLongPress}
      className={cn(
        'group relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 transition-all',
        isSelected && 'ring-2 ring-rose-500 ring-offset-2'
      )}
    >
      <Image
        src={thumbnailUrl}
        alt={photo.description ?? photo.filename}
        fill
        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
        className="object-cover transition-transform group-hover:scale-105"
        placeholder="empty"
      />

      {/* 선택 체크 */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

      {/* 날짜 태그 */}
      {photo.tags.length > 0 && (
        <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {photo.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}