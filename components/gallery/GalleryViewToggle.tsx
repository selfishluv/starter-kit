'use client'

import { useGalleryStore } from '@/hooks/useGalleryStore'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function GalleryViewToggle() {
  const { viewMode, setViewMode } = useGalleryStore()

  return (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'timeline')}>
      <TabsList className="h-8 bg-gray-100">
        <TabsTrigger value="grid" className="h-6 px-3 text-xs gap-1">
          <span>⊞</span> 그리드
        </TabsTrigger>
        <TabsTrigger value="timeline" className="h-6 px-3 text-xs gap-1">
          <span>☰</span> 타임라인
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}