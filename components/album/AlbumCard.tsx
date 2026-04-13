'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getThumbnailUrl } from '@/lib/supabase/storage'
import type { Album } from '@/types/album'

interface AlbumCardProps {
  album: Album & { photoCount?: number; coverPhotoPath?: string }
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/albums/${album.id}`}
      className="group relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      {/* 커버 이미지 */}
      <div className="aspect-[4/3] bg-gradient-to-br from-rose-100 to-pink-100 overflow-hidden">
        {album.coverPhotoPath ? (
          <Image
            src={getThumbnailUrl(album.coverPhotoPath, 'md')}
            alt={album.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-rose-300">
            📁
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{album.name}</h3>
        {album.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{album.description}</p>
        )}
        {album.photoCount !== undefined && (
          <p className="text-xs text-gray-400 mt-1">{album.photoCount}장</p>
        )}
      </div>
    </Link>
  )
}