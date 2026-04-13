/**
 * 사진 데이터베이스 모델
 */
export interface Photo {
  id: string
  album_id: string
  user_id: string
  filename: string
  storage_path: string
  taken_at: string
  description?: string
  tags: string[]
  created_at: string
  updated_at: string
}

/**
 * 사진 메타데이터 (폼 입력용)
 */
export interface PhotoMetadata {
  taken_at: Date
  description?: string
  tags: string[]
  album_id: string
}
