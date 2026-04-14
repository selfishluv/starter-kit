import { searchExistingMembers } from '@/lib/queries/families'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return Response.json({ error: '이메일이 필요합니다' }, { status: 400 })
    }

    const results = await searchExistingMembers(email)
    return Response.json(results)
  } catch (error) {
    console.error('회원 검색 API 오류:', error)
    return Response.json(
      { error: '회원 검색에 실패했습니다' },
      { status: 500 }
    )
  }
}
