'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { addExistingMemberToFamily } from '@/lib/actions/family.actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AddExistingMemberModalProps {
  isOpen: boolean
  familyId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddExistingMemberModal({
  isOpen,
  familyId,
  onClose,
  onSuccess,
}: AddExistingMemberModalProps) {
  const [email, setEmail] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{
      email: string
      user_id: string
      created_at: string
    }>
  >([])
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch() {
    if (!email) {
      toast.error('이메일을 입력해주세요')
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    try {
      const response = await fetch('/api/search-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('검색 실패')
      }

      const results = await response.json()
      if (results.length === 0) {
        toast.info('해당 이메일의 가입된 회원을 찾을 수 없습니다')
      }
      setSearchResults(results)
      setSelectedEmail(null)
    } catch (err) {
      toast.error('회원 검색에 실패했습니다')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  async function handleAdd() {
    if (!selectedEmail) {
      toast.error('회원을 선택해주세요')
      return
    }

    setIsAdding(true)
    try {
      await addExistingMemberToFamily(familyId, selectedEmail)
      toast.success(`${selectedEmail} 회원이 추가되었습니다`)
      handleClose()
      onSuccess()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '회원 추가에 실패했습니다'
      toast.error(errorMessage)
    } finally {
      setIsAdding(false)
    }
  }

  function handleClose() {
    setEmail('')
    setSearchResults([])
    setSelectedEmail(null)
    setHasSearched(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>기존 회원 추가</DialogTitle>
          <DialogDescription>
            이미 가입한 회원을 검색하여 가족에 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 검색 입력 */}
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              placeholder="이메일 주소 입력"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={isSearching}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !email}
              className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
            >
              {isSearching ? '검색 중...' : '검색'}
            </Button>
          </div>

          {/* 검색 결과 */}
          {hasSearched && searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">검색 결과:</p>
              {searchResults.map((result) => (
                <label
                  key={result.user_id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="member"
                    value={result.email}
                    checked={selectedEmail === result.email}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    className="cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{result.email}</p>
                    <p className="text-xs text-gray-500">
                      가입일: {new Date(result.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {hasSearched && searchResults.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              해당 이메일의 가입된 회원이 없습니다
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleClose}
            variant="outline"
          >
            취소
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedEmail || isAdding}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isAdding ? '추가 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
