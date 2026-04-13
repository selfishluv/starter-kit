import { z } from 'zod'

/**
 * 사진 업로드 폼 검증 스키마
 */
export const photoUploadSchema = z.object({
  taken_at: z.date().refine(
    (date) => !!date,
    { message: '촬영 날짜를 선택해주세요.' }
  ),
  description: z.string().max(500).optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10)
    .default([]),
  album_id: z.string().min(1, '앨범을 선택해주세요.'),
})

export type PhotoUploadInput = z.infer<typeof photoUploadSchema>

/**
 * 사진 메타데이터 수정 스키마
 */
export const photoUpdateSchema = z.object({
  description: z.string().max(500).optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10)
    .default([]),
})

export type PhotoUpdateInput = z.infer<typeof photoUpdateSchema>
