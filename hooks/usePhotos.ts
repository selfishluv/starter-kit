'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Photo } from '@/types/photo'

const PHOTOS_PER_PAGE = 20

/**
 * 사진 목록을 무한 스크롤로 조회
 * @param albumId - 앨범 ID (optional)
 * @param tags - 필터링할 태그 배열 (optional)
 */
export function usePhotos(albumId?: string, tags?: string[]) {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['photos', albumId, tags],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('photos')
        .select('*')
        .order('taken_at', { ascending: false })
        .range(pageParam, pageParam + PHOTOS_PER_PAGE - 1)

      if (albumId) {
        query = query.eq('album_id', albumId)
      }

      if (tags && tags.length > 0) {
        // PostgreSQL 배열 포함 검색
        query = query.contains('tags', tags)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as Photo[]) || []
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PHOTOS_PER_PAGE
        ? allPages.length * PHOTOS_PER_PAGE
        : undefined
    },
    initialPageParam: 0,
  })
}

/**
 * 단일 사진 상세 조회
 */
export function usePhoto(photoId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['photos', photoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', photoId)
        .single()

      if (error) throw error
      return data as Photo
    },
    enabled: !!photoId,
  })
}
