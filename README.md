# 아이 앨범관리 Starter Kit

아이의 소중한 순간들을 기록하고 가족과 함께 공유하는 앨범 관리 애플리케이션입니다.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router) + React 19
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4 + shadcn/ui
- **데이터베이스**: Supabase PostgreSQL
- **이미지 저장소**: Supabase Storage
- **인증**: Supabase Auth
- **서버 상태**: TanStack Query v5
- **클라이언트 상태**: Zustand
- **폼 처리**: React Hook Form + Zod
- **알림**: Sonner (Toast)

## 주요 기능

✨ **사진 관리**
- 드래그&드롭 업로드
- 썸네일 자동 생성 (Supabase Transform API)
- 사진 메타데이터 (날짜, 태그, 설명)

📸 **갤러리 뷰**
- 그리드 뷰 (썸네일 목록)
- 타임라인 뷰 (날짜 순 정렬)
- 무한 스크롤

📁 **앨범 관리**
- 앨범 생성/수정/삭제
- 앨범별 사진 분류

👨‍👩‍👧 **가족 공유**
- Magic Link 초대
- Row Level Security (RLS)로 접근 제어
- 가족 멤버 관리

## 빠른 시작

### 1. 환경 설정

\`\`\`bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
\`\`\`

.env.local 파일에 Supabase 설정 추가:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

### 2. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 http://localhost:3000 접속

## 폴더 구조

```
/
├── app/                    # Next.js App Router
├── components/             # React 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── photo/             # 사진 관련 컴포넌트
│   ├── album/             # 앨범 관련 컴포넌트
│   └── layout/            # 레이아웃 컴포넌트
├── hooks/                  # Custom React hooks
├── lib/
│   ├── supabase/          # Supabase 클라이언트
│   ├── actions/           # Server Actions
│   └── queries/           # DB 쿼리 함수
├── schemas/                # Zod 스키마
├── types/                  # TypeScript 타입
└── middleware.ts           # 미들웨어
```

## 다음 단계

1. Supabase 프로젝트 생성 및 환경 변수 설정
2. 인증 페이지 구현 (login/page.tsx)
3. 대시보드 레이아웃 구현
4. 갤러리 컴포넌트 개발
5. 사진 업로드 폼 구현

## 라이센스

MIT
