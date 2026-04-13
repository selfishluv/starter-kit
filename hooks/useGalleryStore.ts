'use client'

import { create } from 'zustand'

type ViewMode = 'grid' | 'timeline'

interface GalleryStore {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  selectedPhotos: Set<string>
  togglePhotoSelection: (photoId: string) => void
  clearSelection: () => void
  isDetailModalOpen: boolean
  setDetailModalOpen: (open: boolean) => void
  selectedPhotoId: string | null
  setSelectedPhotoId: (photoId: string | null) => void
}

/**
 * 갤러리 UI 상태 관리
 * - 뷰 모드 (그리드/타임라인)
 * - 선택된 사진들
 * - 상세 모달 열림 상태
 */
export const useGalleryStore = create<GalleryStore>((set) => ({
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),

  selectedPhotos: new Set(),
  togglePhotoSelection: (photoId) =>
    set((state) => {
      const newSelected = new Set(state.selectedPhotos)
      if (newSelected.has(photoId)) {
        newSelected.delete(photoId)
      } else {
        newSelected.add(photoId)
      }
      return { selectedPhotos: newSelected }
    }),
  clearSelection: () => set({ selectedPhotos: new Set() }),

  isDetailModalOpen: false,
  setDetailModalOpen: (open) => set({ isDetailModalOpen: open }),

  selectedPhotoId: null,
  setSelectedPhotoId: (photoId) => set({ selectedPhotoId: photoId }),
}))
