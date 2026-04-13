'use client'

import Image from 'next/image'
import { toast } from 'sonner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useGalleryStore } from '@/hooks/useGalleryStore'
import { usePhoto } from '@/hooks/usePhotos'
import { getOriginalUrl } from '@/lib/supabase/storage'
import { deletePhoto } from '@/lib/actions/photo.actions'
import { useQueryClient } from '@tanstack/react-query'

export function PhotoDetailModal() {
  const { isDetailModalOpen, setDetailModalOpen, selectedPhotoId, setSelectedPhotoId } =
    useGalleryStore()
  const { data: photo, isPending } = usePhoto(selectedPhotoId ?? '')
  const queryClient = useQueryClient()

  function handleClose() {
    setDetailModalOpen(false)
    setSelectedPhotoId(null)
  }

  async function handleDelete() {
    if (!photo) return
    if (!confirm('이 사진을 삭제할까요?')) return

    try {
      await deletePhoto(photo.id)
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      toast.success('사진이 삭제되었습니다.')
      handleClose()
    } catch {
      toast.error('사진 삭제에 실패했습니다.')
    }
  }

  return (
    <Dialog open={isDetailModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-none">
        {isPending ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : photo ? (
          <div className="flex flex-col lg:flex-row">
            {/* 이미지 영역 */}
            <div className="relative aspect-square w-full lg:w-2/3 bg-black">
              <Image
                src={getOriginalUrl(photo.storage_path)}
                alt={photo.description ?? photo.filename}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 67vw"
              />
            </div>

            {/* 메타데이터 패널 */}
            <div className="flex flex-col bg-white p-5 lg:w-1/3">
              {/* 날짜 */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">촬영일</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(photo.taken_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* 설명 */}
              {photo.description && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">설명</p>
                  <p className="text-sm text-gray-700">{photo.description}</p>
                </div>
              )}

              {/* 태그 */}
              {photo.tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">태그</p>
                  <div className="flex flex-wrap gap-1">
                    {photo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 파일명 */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 mb-1">파일명</p>
                <p className="text-xs text-gray-500 break-all">{photo.filename}</p>
              </div>

              {/* 삭제 버튼 */}
              <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={handleDelete}
                  className="w-full rounded-lg border border-red-200 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}