'use server'

import { createClient } from '@/lib/supabase/server'
import { photoUploadSchema, photoUpdateSchema } from '@/schemas/photo.schema'
import type { Photo } from '@/types/photo'

/**
 * 사진 메타데이터를 데이터베이스에 저장
 * 실제 이미지 파일은 클라이언트에서 Supabase Storage로 직접 업로드
 */
export async function createPhotoMetadata(input: {
  albumId: string
  filename: string
  storagePath: string
  taken_at: Date
  description?: string
  tags: string[]
}) {
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('인증 필요')
  }

  // 입력값 검증
  const validatedData = photoUploadSchema.parse({
    album_id: input.albumId,
    taken_at: input.taken_at,
    description: input.description,
    tags: input.tags,
  })

  const { data, error } = await supabase
    .from('photos')
    .insert([
      {
        album_id: validatedData.album_id,
        user_id: user.id,
        filename: input.filename,
        storage_path: input.storagePath,
        taken_at: validatedData.taken_at.toISOString(),
        description: validatedData.description,
        tags: validatedData.tags,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('사진 메타데이터 저장 오류:', error)
    throw new Error('사진 저장에 실패했습니다')
  }

  return data as Photo
}

/**
 * 사진 메타데이터 수정
 */
export async function updatePhotoMetadata(
  photoId: string,
  input: {
    description?: string
    tags: string[]
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('인증 필요')
  }

  // 입력값 검증
  const validatedData = photoUpdateSchema.parse(input)

  const { data, error } = await supabase
    .from('photos')
    .update({
      description: validatedData.description,
      tags: validatedData.tags,
    })
    .eq('id', photoId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('사진 메타데이터 수정 오류:', error)
    throw new Error('사진 수정에 실패했습니다')
  }

  return data as Photo
}

/**
 * 사진 삭제
 */
export async function deletePhoto(photoId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('인증 필요')
  }

  // 먼저 사진 정보 조회 (storage_path 확인)
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    throw new Error('사진을 찾을 수 없습니다')
  }

  // Storage에서 파일 삭제
  const { error: storageError } = await supabase.storage
    .from('photos')
    .remove([photo.storage_path])

  if (storageError) {
    console.error('스토리지 파일 삭제 오류:', storageError)
    // Storage 오류는 경고만 하고 계속 진행
  }

  // DB에서 삭제
  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (dbError) {
    console.error('사진 삭제 오류:', dbError)
    throw new Error('사진 삭제에 실패했습니다')
  }
}
