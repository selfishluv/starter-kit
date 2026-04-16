# 가족 사진 앨범 (Family Album) - 프로젝트 가이드

## 프로젝트 개요

Next.js 16 + Supabase 기반의 가족 공유 사진 앨범 관리 애플리케이션입니다. 가족 단위로 사진을 체계적으로 관리하고 공유할 수 있습니다.

**주요 기능:**
- 🔐 Magic Link 인증 (Supabase)
- 👨‍👩‍👧‍👦 가족 멤버 관리 (Owner/Member 역할)
- 📷 사진 갤러리 및 앨범 관리
- 🔄 실시간 데이터 동기화 (TanStack Query)

---

## 기술 스택

### 프레임워크 & 언어
- **Next.js 16.2.3** - App Router (SSR + Server Actions)
- **React 19.2.4** - 최신 버전
- **TypeScript 5** - strict mode 활성화

### 상태 관리 & 데이터 페칭
- **TanStack Query (React Query) 5** - 서버 상태 관리
- **Zustand 5** - 클라이언트 상태 관리 (Gallery 관련)
- **Supabase Client (SSR 패턴)** - 인증 + 데이터베이스

### 폼 & 검증
- **React Hook Form 7** - 폼 상태 관리
- **Zod 4** - 런타임 스키마 검증
- **@hookform/resolvers** - Zod + React Hook Form 통합

### UI & 스타일
- **Tailwind CSS 4** - 유틸리티 기반 CSS
- **shadcn/ui** - 헤드리스 컴포넌트
- **Lucide React 1.8** - 아이콘 라이브러리
- **Sonner 2** - 토스트 알림
- **Geist 폰트** - 기본 폰트

### 개발 도구
- **ESLint 9** - 코드 품질 검사
- **Tailwind CSS PostCSS 4**
- **tw-animate-css** - Tailwind CSS 애니메이션

---

## 프로젝트 구조

```
├── app/
│   ├── (auth)/           # 인증 관련 라우트 (로그인, 회원가입)
│   ├── (dashboard)/      # 대시보드 (인증 필수)
│   ├── api/              # API 라우트
│   ├── auth/             # Supabase 콜백
│   ├── layout.tsx        # 루트 레이아웃
│   ├── page.tsx          # 홈페이지
│   └── providers.tsx     # React Query 설정
├── components/           # React 컴포넌트
│   ├── album/           # 앨범 관련
│   ├── gallery/         # 갤러리 관련
│   ├── modals/          # 모달 컴포넌트
│   ├── photo/           # 사진 관련
│   ├── layout/          # 레이아웃 컴포넌트 (Navbar, MobileBottomNav)
│   └── ui/              # shadcn/ui 컴포넌트
├── hooks/               # 커스텀 React 훅
│   ├── useAlbums.ts    # 앨범 CRUD + 쿼리
│   ├── usePhotos.ts    # 사진 CRUD
│   └── useGalleryStore.ts # Zustand 상태
├── lib/
│   ├── actions/         # Server Actions (서버사이드)
│   │   ├── family.actions.ts    # 가족 관리
│   │   ├── album.actions.ts     # 앨범 관리
│   │   └── photo.actions.ts     # 사진 관리
│   ├── queries/         # 데이터 조회 함수
│   │   └── families.ts          # 가족 데이터 조회
│   ├── supabase/
│   │   └── server.ts    # Supabase Server Client
│   └── utils.ts         # 유틸리티 함수
├── types/               # TypeScript 타입 정의
│   ├── album.ts         # Album 관련 타입
│   └── photo.ts         # Photo 관련 타입
├── schemas/             # Zod 스키마
│   ├── album.schema.ts  # Album 스키마
│   └── photo.schema.ts  # Photo 스키마
└── public/              # 정적 파일
```

---

## 핵심 아키텍처 패턴

### 1. Server Components + Server Actions
- **전략**: 데이터 변조는 Server Actions에서 수행
- **위치**: `lib/actions/*.ts`
- **특징**: 'use server' 디렉티브, 직접 DB 접근, 권한 검증

```typescript
// 예: 가족 생성 (Server Action)
export async function createFamily(input: { name?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증 필요')
  // ... DB 조작
}
```

### 2. Client-Side Data Fetching (TanStack Query)
- **전략**: 클라이언트에서 조회 쿼리 실행
- **위치**: `hooks/use*.ts`
- **캐싱**: staleTime 5분, gcTime 10분
- **특징**: 자동 백그라운드 동기화

```typescript
// 예: useAlbums 훅
export function useAlbums(familyId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['albums', familyId],
    queryFn: async () => { /* ... */ },
    enabled: !!familyId,
  })
}
```

### 3. Supabase SSR 패턴
- **인증**: Magic Link OTP (비밀번호 없음)
- **쿠키 기반**: 서버/클라이언트 간 세션 동기화
- **에러 처리**: 각 API 호출마다 try-catch

### 4. 권한 시스템 (Role-Based)
- **모델**: `family_members` 테이블 (owner/member role)
- **owner**: 가족 생성자, 멤버 초대/관리 권한
- **member**: 가족의 앨범/사진 조회/생성 권한
- **pending**: 초대된 사용자 (아직 가입 안 함, user_id=null)

### 5. Form 관리
- **React Hook Form**: 폼 상태 관리
- **Zod 스키마**: 런타임 검증
- **위치**: `schemas/*.schema.ts`에 정의

---

## 주요 API 및 Server Actions

### Family Management (`lib/actions/family.actions.ts`)
- `createFamily()` - 새 가족 생성
- `inviteFamilyMember()` - Magic Link로 멤버 초대
- `acceptFamilyInvite()` - 초대 수락
- `removeFamilyMember()` - 멤버 제거
- `updateFamily()` - 가족 정보 수정

### Album Management (`lib/actions/album.actions.ts`)
- `createAlbum()` - 새 앨범 생성
- `updateAlbum()` - 앨범 정보 수정
- `deleteAlbum()` - 앨범 삭제
- `setCoverPhoto()` - 앨범 커버 사진 설정

### Photo Management (`lib/actions/photo.actions.ts`)
- `uploadPhoto()` - 사진 업로드
- `deletePhoto()` - 사진 삭제
- `reorderPhotos()` - 사진 순서 변경

### Data Queries (`lib/queries/families.ts`)
- `getFamilies()` - 사용자의 모든 가족 조회
- `getFamilyMembers()` - 가족 멤버 목록

---

## 개발 가이드

### 새로운 기능 추가 시 체크리스트

1. **타입 정의** (`types/`)
   - TypeScript 인터페이스 작성
   - Supabase 테이블 스키마와 동기화

2. **스키마 검증** (`schemas/`)
   - Zod로 입력값 검증 스키마 작성
   - 필수/선택 필드 명확히

3. **Server Actions** (`lib/actions/`)
   - 'use server' 디렉티브
   - 권한 검증 포함
   - 에러 처리 (console.error + 사용자 메시지)

4. **커스텀 훅** (`hooks/`)
   - useQuery/useMutation 조합
   - queryKey 네이밍 규칙 준수
   - onSuccess에서 캐시 무효화

5. **컴포넌트** (`components/`)
   - 'use client' 필요시만 사용
   - Server Components 우선
   - Tailwind CSS + shadcn/ui 활용

### 네이밍 컨벤션
- **파일명**: kebab-case (예: `FamilyMemberModal.tsx`)
- **변수/함수**: camelCase (예: `createFamily`)
- **상수**: UPPER_SNAKE_CASE (예: `STALE_TIME`)
- **타입/인터페이스**: PascalCase (예: `Family`)

### CSS 클래스 작성
- **Tailwind CSS** 유틸리티 우선
- **클래스명**: `className="flex items-center gap-2"`
- **반응형**: `sm:`, `md:`, `lg:`, `xl:` 프리픽스
- **다크모드**: 현재 미구현 (향후 추가 가능)

---

## 주의사항 & 피해야 할 패턴

### ❌ 하지 말아야 할 것
- **Client에서 권한 검증**: 항상 Server Actions에서 검증
- **비밀번호 저장**: Magic Link 사용
- **동기 API 호출**: TanStack Query 사용
- **클라이언트에서 DB 직접 접근**: Server Actions 경유

### ⚠️ 주의할 점
- **쿠키 설정 에러**: SSR 환경에서 무시됨 (정상)
- **쿼리 캐시 만료**: 5분 후 백그라운드에서 리페치
- **Magic Link 이메일 전송 시간**: 실제 운영에서 지연 가능
- **Supabase RLS 정책**: 데이터베이스 수준 보안 필수

---

## 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 프로덕션에서 변경 필요
```

---

## 커밋 메시지 컨벤션

한국어로 작성, 명확한 제목과 설명:

```
feat: 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
docs: 문서 수정
style: 코드 스타일 변경 (기능 변화 없음)
test: 테스트 추가/수정
```

---

## 다음 단계

- [ ] 데이터베이스 RLS 정책 강화
- [ ] 실시간 업데이트 (Supabase Realtime)
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 다크모드 지원
- [ ] 오프라인 지원 (Service Worker)
- [ ] 성능 모니터링 (Sentry 등)

---

## 참고 자료

- [Next.js 16 공식 문서](https://nextjs.org)
- [Supabase 문서](https://supabase.com/docs)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Tailwind CSS 문서](https://tailwindcss.com)