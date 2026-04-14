import { createClient } from './client'

type ThumbnailSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<ThumbnailSize, number> = {
  sm: 200,
  md: 400,
  lg: 800,
}

/**
 * Supabase Storage Transform API를 이용한 썸네일 URL 생성
 * 원본 파일은 1회만 업로드, 썸네일은 Supabase CDN 엣지에서 캐싱
 */
export function getThumbnailUrl(
  path: string,
  size: ThumbnailSize = 'md'
): string {
  const supabase = createClient()
  const width = sizeMap[size]
  const height = sizeMap[size]

  // Supabase 변환 옵션
  const transformOptions = {
    transform: {
      width,
      height,
      resize: 'cover' as const, // 비율 유지하며 중앙 크롭
      quality: 80,
    },
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(path, transformOptions)

  return data.publicUrl
}

/**
 * 원본 이미지 URL 반환
 */
export function getOriginalUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}
