import { NextResponse } from 'next/server'
import { getUserFamilyId } from '@/lib/queries/families'

export async function GET() {
  try {
    const familyId = await getUserFamilyId()
    // familyId가 null이면 가족이 없음을 의미
    return NextResponse.json({ familyId })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '조회 실패'
    console.error('familyId 조회 오류:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
