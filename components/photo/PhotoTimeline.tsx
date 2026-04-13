'use client'

import { useRef, useCallback } from 'react'
import Image from 'next/image'
import { usePhotos } from '@/hooks/usePhotos'
import { useGalleryStore } from '@/hooks/useGalleryStore'
import { getThumbnailUrl } from '@/lib/supabase/storage'
import { Skeleton } from '@/components/ui/skeleton'
import type { Photo } from '@/types/photo'

interface PhotoTimelineProps {
  albumId?: string
  tags?: string[]
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function groupByDate(photos: Photo[]): Record<string, Photo[]> {
  return photos.reduce<Record<string, Photo[]>>((acc, photo) => {
    const key = formatDate(photo.taken_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(photo)
    return acc
  }, {})
}

export function PhotoTimeline({ albumId, tags }: PhotoTimelineProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    usePhotos(albumId, tags)
  const { setSelectedPhotoId, setDetailModalOpen } = useGalleryStore()

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  const allPhotos = data?.pages.flat() ?? []
  const grouped = groupByDate(allPhotos)

  if (isPending) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="aspect-[4/3] w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (allPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📷</div>
        <p className="text-gray-500 font-medium">사진이 없습니다</p>
        <p className="text-gray-400 text-sm mt-1">첫 번째 사진을 업로드해보세요!</p>
      </div>
    )
  }

  const dateKeys = Object.keys(grouped)

  return (
    <div className="space-y-10">
      {dateKeys.map((date, dateIndex) => {
        const photos = grouped[date]
        const isLastGroup = dateIndex === dateKeys.length - 1

        return (
          <section key={date}>
            {/* 날짜 헤더 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-2 w-2 rounded-full bg-rose-400" />
              <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
              <span className="text-xs text-gray-400">{photos.length}장</span>
            </div>

            {/* 사진 그리드 (타임라인은 2열) */}
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, photoIndex) => {
                const isLast = isLastGroup && photoIndex === photos.length - 1
                const thumbnailUrl = getThumbnailUrl(photo.storage_path, 'md')

                return (
                  <div key={photo.id} ref={isLast ? lastRef : null}>
                    <button
                      onClick={() => {
                        setSelectedPhotoId(photo.id)
                        setDetailModalOpen(true)
                      }}
                      className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100"
                    >
                      <Image
                        src={thumbnailUrl}
                        alt={photo.description ?? photo.filename}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform group-hover:scale-105"
                        placeholder="empty"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {isFetchingNextPage && (
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}