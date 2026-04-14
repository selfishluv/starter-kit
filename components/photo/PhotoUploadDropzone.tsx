'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { createPhotoMetadata } from '@/lib/actions/photo.actions'
import { cn } from '@/lib/utils'

interface PhotoUploadDropzoneProps {
  albumId: string
  onSuccess?: () => void
}

interface UploadFile {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
}

export function PhotoUploadDropzone({ albumId, onSuccess }: PhotoUploadDropzoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const supabase = createClient()

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith('image/'))
    const uploads: UploadFile[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }))
    setFiles((prev) => [...prev, ...uploads])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  async function handleUpload() {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    let successCount = 0

    for (const uploadFile of pendingFiles) {
      try {
        // 상태 업데이트: uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, status: 'uploading', progress: 10 } : f
          )
        )

        // 파일명 생성 (유니크)
        const ext = uploadFile.file.name.split('.').pop()
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const storagePath = `${albumId}/${filename}`

        // Supabase Storage 업로드
        const { error: storageError } = await supabase.storage
          .from('photos')
          .upload(storagePath, uploadFile.file, { upsert: false })

        if (storageError) throw storageError

        // 스토리지 업로드 완료, 진행율 70% 업데이트
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, progress: 70 } : f
          )
        )

        // DB에 메타데이터 저장
        await createPhotoMetadata({
          albumId,
          filename: uploadFile.file.name,
          storagePath,
          taken_at: new Date(),
          tags: [],
        })

        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, status: 'done', progress: 100 } : f
          )
        )
        successCount++
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '업로드 실패'
        console.error('업로드 오류:', err)
        toast.error(`업로드 실패: ${errorMessage}`)
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file ? { ...f, status: 'error' } : f
          )
        )
      }
    }

    setIsUploading(false)

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      toast.success(`${successCount}장 업로드 완료!`)
      onSuccess?.()
    }
  }

  function removeFile(file: File) {
    setFiles((prev) => prev.filter((f) => f.file !== file))
  }

  function clearCompleted() {
    setFiles((prev) => prev.filter((f) => f.status !== 'done'))
  }

  return (
    <div className="space-y-4">
      {/* 드롭존 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors',
          isDragging
            ? 'border-rose-400 bg-rose-50'
            : 'border-gray-200 bg-gray-50 hover:border-rose-300 hover:bg-rose-50/30'
        )}
      >
        <div className="text-4xl">📸</div>
        <div className="text-center">
          <p className="font-medium text-gray-700">사진을 끌어다 놓거나 클릭하세요</p>
          <p className="text-sm text-gray-400 mt-1">PNG, JPG, HEIC 지원</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{files.length}장 선택됨</p>
            {files.some((f) => f.status === 'done') && (
              <button
                onClick={clearCompleted}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                완료 항목 지우기
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {files.map((uploadFile) => (
              <div key={uploadFile.file.name} className="relative group">
                {/* 미리보기 */}
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadFile.preview}
                    alt={uploadFile.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 진행 바 */}
                {uploadFile.status === 'uploading' && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200 rounded-b-lg">
                    <div
                      className="h-full bg-rose-500 rounded-b-lg transition-all"
                      style={{ width: `${uploadFile.progress}%` }}
                    />
                  </div>
                )}

                {/* 완료 표시 */}
                {uploadFile.status === 'done' && (
                  <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* 오류 표시 */}
                {uploadFile.status === 'error' && (
                  <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}

                {/* 삭제 버튼 */}
                {uploadFile.status === 'pending' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(uploadFile.file) }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 업로드 버튼 */}
          {files.some((f) => f.status === 'pending') && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full rounded-lg bg-rose-500 py-3 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              {isUploading ? '업로드 중...' : `${files.filter(f => f.status === 'pending').length}장 업로드`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
