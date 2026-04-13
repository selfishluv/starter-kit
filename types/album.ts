/**
 * 앨범 데이터베이스 모델
 */
export interface Album {
  id: string
  family_id: string
  name: string
  description?: string
  cover_photo_id?: string
  created_at: string
  updated_at: string
}

/**
 * 가족 구성원
 */
export interface FamilyMember {
  id: string
  family_id: string
  user_id: string
  email: string
  role: 'owner' | 'member'
  invited_at: string
  joined_at?: string
}
