# 아이 앨범관리 Starter Kit - 설정 가이드

## ✅ 완성된 항목

### 1. 프로젝트 구조
- ✅ Next.js 15 (App Router) 프로젝트 생성
- ✅ TypeScript strict mode 설정
- ✅ Tailwind CSS v4 설정
- ✅ shadcn/ui 초기화 (button, dialog, sheet, dropdown-menu, skeleton, tabs)

### 2. 의존성 설치
```json
- @supabase/ssr
- @supabase/supabase-js
- @tanstack/react-query
- zustand
- react-hook-form
- zod
- @hookform/resolvers
- sonner
- clsx, tailwind-merge
```

### 3. 핵심 파일 생성

#### Supabase 통합
- `lib/supabase/client.ts` - 브라우저용 클라이언트
- `lib/supabase/server.ts` - 서버용 클라이언트
- `lib/supabase/storage.ts` - 썸네일 생성 유틸 (Transform API)
- `lib/supabase/middleware.ts` - 세션 갱신 미들웨어

#### 타입 정의
- `types/photo.ts` - 사진 인터페이스
- `types/album.ts` - 앨범 인터페이스

#### 검증 스키마
- `schemas/photo.schema.ts` - 사진 업로드/수정 Zod 스키마
- `schemas/album.schema.ts` - 앨범 생성/수정 Zod 스키마

#### 데이터 처리
- `hooks/usePhotos.ts` - TanStack Query 사진 조회 (무한스크롤)
- `hooks/useAlbums.ts` - TanStack Query 앨범 CRUD
- `hooks/useGalleryStore.ts` - Zustand 갤러리 UI 상태

#### Server Actions
- `lib/actions/photo.actions.ts` - 사진 메타데이터 저장/수정/삭제
- `lib/actions/album.actions.ts` - 앨범 CRUD

#### 설정 파일
- `middleware.ts` - 세션 갱신 미들웨어
- `next.config.ts` - Supabase Storage 이미지 원격 패턴
- `app/providers.tsx` - React Query 클라이언트 설정
- `app/layout.tsx` - 루트 레이아웃 (Sonner Toast)
- `app/page.tsx` - 홈 페이지 (로그인 화면)

### 4. 빌드 검증
- ✅ TypeScript 타입 체크 통과
- ✅ Next.js 프로덕션 빌드 성공

---

## 🚀 다음 단계

### 1단계: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 무료 프로젝트 생성
2. 프로젝트 설정에서 Anon Key 복사
3. `.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

`.env.local`에 작성:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2단계: 데이터베이스 테이블 생성

Supabase 대시보드 → SQL Editor에서 다음 쿼리 실행:

```sql
-- 가족 테이블
CREATE TABLE families (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 가족 멤버 테이블
CREATE TABLE family_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'member')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- 앨범 테이블
CREATE TABLE albums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_photo_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 사진 테이블
CREATE TABLE photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  taken_at timestamptz NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_albums_family_id ON albums(family_id);
CREATE INDEX idx_photos_album_id ON photos(album_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_taken_at ON photos(taken_at DESC);

-- RLS 활성화
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view their own family"
  ON families FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Family members can view albums"
  ON albums FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Family members can view photos"
  ON photos FOR SELECT
  USING (album_id IN (
    SELECT id FROM albums
    WHERE family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  ));
```

### 3단계: Storage 버킷 생성

1. Supabase 대시보드 → Storage
2. `photos` 버킷 생성 (공개)
3. RLS 정책 설정:

```sql
-- 조회 권한
CREATE POLICY "Family members can view photos"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'photos'
    AND auth.uid() IS NOT NULL
  );

-- 업로드 권한
CREATE POLICY "Users can upload photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid() IS NOT NULL
  );

-- 삭제 권한
CREATE POLICY "Users can delete their photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid() = owner
  );
```

### 4단계: 인증 페이지 구현

`app/(auth)/login/page.tsx` 생성:
- Supabase Auth UI 또는 커스텀 폼
- 회원가입, 로그인, 초대 링크 수락

### 5단계: 대시보드 구현

`app/(dashboard)/layout.tsx` 생성:
- 인증 체크
- 네비게이션 (Navbar + MobileBottomNav)

`app/(dashboard)/page.tsx`:
- 최근 사진 표시
- 앨범 목록

### 6단계: 갤러리 컴포넌트

`components/photo/` 디렉토리:
- `PhotoGrid.tsx` - 그리드 뷰
- `PhotoTimeline.tsx` - 타임라인 뷰
- `PhotoCard.tsx` - 사진 카드 (썸네일)
- `PhotoDetailModal.tsx` - 상세 모달
- `PhotoUploadDropzone.tsx` - 드래그&드롭 업로드

### 7단계: 앨범 관리

`components/album/` 디렉토리:
- `AlbumCard.tsx` - 앨범 카드
- `CreateAlbumDialog.tsx` - 앨범 생성 모달

### 8단계: 가족 공유

`app/(dashboard)/settings/page.tsx`:
- 가족 멤버 조회
- Magic Link 초대 생성

---

## 📚 주요 패턴

### Server Action 사용 예시

```tsx
'use client'

import { createPhotoMetadata } from '@/lib/actions/photo.actions'
import { useTransition } from 'react'

export function UploadForm() {
  const [isPending, startTransition] = useTransition()

  async function handleUpload(formData: FormData) {
    startTransition(async () => {
      await createPhotoMetadata({
        albumId: 'album-123',
        filename: 'photo.jpg',
        storagePath: 'path/to/photo.jpg',
        taken_at: new Date(),
        tags: [],
      })
    })
  }

  return <form action={handleUpload}>...</form>
}
```

### React Query 사용 예시

```tsx
'use client'

import { usePhotos } from '@/hooks/usePhotos'

export function PhotoList() {
  const { data, fetchNextPage, hasNextPage, isPending } = usePhotos('album-123')

  return (
    <div>
      {data?.pages.map((page) =>
        page.map((photo) => <PhotoCard key={photo.id} photo={photo} />)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isPending}>
          더보기
        </button>
      )}
    </div>
  )
}
```

### Zustand 상태 사용

```tsx
'use client'

import { useGalleryStore } from '@/hooks/useGalleryStore'

export function GalleryViewToggle() {
  const { viewMode, setViewMode } = useGalleryStore()

  return (
    <button onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}>
      {viewMode === 'grid' ? '타임라인' : '그리드'}로 보기
    </button>
  )
}
```

---

## 🛠️ 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000에서 확인

---

## 📦 배포

```bash
npm run build
npm start
```

또는 Vercel, Railway 등의 호스팅 서비스 사용

---

## 🎯 완성도

- ✅ 프로젝트 구조: 100%
- ✅ 기본 설정: 100%
- ✅ 타입 정의: 100%
- ✅ 데이터 처리 로직: 100%
- ⏳ UI 컴포넌트: 0% (다음 단계)
- ⏳ 인증 페이지: 0% (다음 단계)
- ⏳ 갤러리: 0% (다음 단계)

---

## 📝 참고 사항

- 모든 파일은 한국어 주석으로 작성됨
- TypeScript strict mode 활성화
- ESM 모듈 방식 사용
- Server/Client 컴포넌트 구분 명확

문제가 발생하면 `.next` 폴더를 삭제하고 `npm run build`를 다시 실행해보세요.
