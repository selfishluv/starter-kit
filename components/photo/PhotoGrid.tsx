'use client'

import { useRef, useCallback } from 'react'
import { usePhotos } from '@/hooks/usePhotos'
import { PhotoCard } from './PhotoCard'
import { Skeleton } from '@/components/ui/skeleton'

interface PhotoGridProps {
  albumId?: string
  tags?: string[]
}

export function PhotoGrid({ albumId, tags }: PhotoGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    usePhotos(albumId, tags)

  // 무한 스크롤: 마지막 요소 감지
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastPhotoRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  const allPhotos = data?.pages.flat() ?? []

  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
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

  return (
    <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5">
      {allPhotos.map((photo, index) => {
        const isLast = index === allPhotos.length - 1
        return (
          <div key={photo.id} ref={isLast ? lastPhotoRef : null}>
            <PhotoCard photo={photo} />
          </div>
        )
      })}

      {/* 로딩 스켈레톤 */}
      {isFetchingNextPage &&
        Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`loading-${i}`} className="aspect-square w-full rounded-lg" />
        ))}
    </div>
  )
}