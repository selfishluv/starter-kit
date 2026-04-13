'use server'

import { createClient } from '@/lib/supabase/server'
import { albumCreateSchema, albumUpdateSchema } from '@/schemas/album.schema'
import type { Album } from '@/types/album'

/**
 * 앨범 생성
 */
export async function createAlbum(input: {
  familyId: string
  name: string
  description?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('인증 필요')
  }

  // 입력값 검증
  const validatedData = albumCreateSchema.parse({
    name: input.name,
    description: input.description,
  })

  const { data, error } = await supabase
    .from('albums')
    .insert([
      {
        family_id: input.familyId,
        name: validatedData.name,
        description: validatedData.description,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('앨범 생성 오류:', error)
    throw new Error('앨범 생성에 실패했습니다')
  }

  return data as Album
}

/**
 * 앨범 정보 수정
 */
export async function updateAlbum(
  albumId: string,
  input: {
    name: string
    description?: string
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
  const validatedData = albumUpdateSchema.parse(input)

  const { data, error } = await supabase
    .from('albums')
    .update({
      name: validatedData.name,
      description: validatedData.description,
    })
    .eq('id', albumId)
    .select()
    .single()

  if (error) {
    console.error('앨범 수정 오류:', error)
    throw new Error('앨범 수정에 실패했습니다')
  }

  return data as Album
}

/**
 * 앨범 삭제
 */
export async function deleteAlbum(albumId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('인증 필요')
  }

  // 앨범 내 모든 사진 조회
  const { data: photos, error: fetchError } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('album_id', albumId)

  if (fetchError) {
    console.error('사진 조회 오류:', fetchError)
    throw new Error('앨범 삭제에 실패했습니다')
  }

  // Storage에서 모든 파일 삭제
  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path)
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove(paths)

    if (storageError) {
      console.error('스토리지 파일 삭제 오류:', storageError)
      // Storage 오류는 경고만 하고 계속 진행
    }
  }

  // DB에서 사진 삭제
  await supabase.from('photos').delete().eq('album_id', albumId)

  // DB에서 앨범 삭제
  const { error: dbError } = await supabase
    .from('albums')
    .delete()
    .eq('id', albumId)

  if (dbError) {
    console.error('앨범 삭제 오류:', dbError)
    throw new Error('앨범 삭제에 실패했습니다')
  }
}
