import { NextResponse } from 'next/server'
import { getUserFamilies } from '@/lib/queries/families'

export async function GET() {
  try {
    const families = await getUserFamilies()
    return NextResponse.json({ families })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '조회 실패'
    console.error('가족 목록 조회 오류:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
