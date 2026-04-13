'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Album } from '@/types/album'
import type { AlbumCreateInput, AlbumUpdateInput } from '@/schemas/album.schema'

/**
 * 현재 가족의 앨범 목록 조회
 */
export function useAlbums(familyId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['albums', familyId],
    queryFn: async () => {
      let query = supabase
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false })

      if (familyId) {
        query = query.eq('family_id', familyId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as Album[]) || []
    },
    enabled: !!familyId,
  })
}

/**
 * 단일 앨범 상세 조회
 */
export function useAlbum(albumId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['albums', albumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .single()

      if (error) throw error
      return data as Album
    },
    enabled: !!albumId,
  })
}

/**
 * 앨범 생성
 */
export function useCreateAlbum() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: AlbumCreateInput & { familyId: string }) => {
      const { data, error } = await supabase
        .from('albums')
        .insert([
          {
            family_id: input.familyId,
            name: input.name,
            description: input.description,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data as Album
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
    },
  })
}

/**
 * 앨범 수정
 */
export function useUpdateAlbum() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (
      input: AlbumUpdateInput & { albumId: string }
    ) => {
      const { data, error } = await supabase
        .from('albums')
        .update({
          name: input.name,
          description: input.description,
        })
        .eq('id', input.albumId)
        .select()
        .single()

      if (error) throw error
      return data as Album
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
    },
  })
}

/**
 * 앨범 삭제
 */
export function useDeleteAlbum() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (albumId: string) => {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
    },
  })
}
