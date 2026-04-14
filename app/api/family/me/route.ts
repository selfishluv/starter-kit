import { NextResponse } from 'next/server'
import { getUserFamilyId } from '@/lib/queries/families'

export async function GET() {
  try {
    const familyId = await getUserFamilyId()
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
