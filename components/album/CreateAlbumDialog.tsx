'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { albumCreateSchema, type AlbumCreateInput } from '@/schemas/album.schema'
import { useCreateAlbum } from '@/hooks/useAlbums'

interface CreateAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
}

export function CreateAlbumDialog({
  open,
  onOpenChange,
  familyId,
}: CreateAlbumDialogProps) {
  const { mutateAsync: createAlbum } = useCreateAlbum()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlbumCreateInput>({
    resolver: zodResolver(albumCreateSchema),
  })

  async function onSubmit(data: AlbumCreateInput) {
    try {
      await createAlbum({ ...data, familyId })
      toast.success(`"${data.name}" 앨범이 생성되었습니다.`)
      reset()
      onOpenChange(false)
    } catch {
      toast.error('앨범 생성에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>새 앨범 만들기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              앨범 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="예: 첫 번째 생일"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 (선택)
            </label>
            <textarea
              {...register('description')}
              placeholder="앨범에 대한 설명을 입력하세요"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            >
              {isSubmitting ? '생성 중...' : '만들기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}