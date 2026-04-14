import { NextResponse } from 'next/server'
import { getFamilyWithMembers } from '@/lib/queries/families'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { family, members } = await getFamilyWithMembers(params.id)
    return NextResponse.json({ family, members })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '조회 실패'
    console.error('가족 정보 조회 오류:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
