import { z } from 'zod'

/**
 * 앨범 생성 폼 검증 스키마
 */
export const albumCreateSchema = z.object({
  name: z
    .string()
    .min(1, '앨범 이름을 입력해주세요.')
    .max(100),
  description: z.string().max(500).optional(),
})

export type AlbumCreateInput = z.infer<typeof albumCreateSchema>

/**
 * 앨범 수정 폼 검증 스키마
 */
export const albumUpdateSchema = albumCreateSchema

export type AlbumUpdateInput = z.infer<typeof albumUpdateSchema>

/**
 * 가족 멤버 초대 스키마
 */
export const inviteMemberSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
