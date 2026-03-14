import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import { truncate } from '@/utils/truncate'
import { useQuestionReviewQueue, useReviewQuestion } from '../hooks/useAdminData'

export default function QuestionReviewPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const query = useQuestionReviewQueue({ page, limit: 10, review_status: 'PENDING' })
  const reviewMutation = useReviewQuestion()

  if (query.isLoading) return <LoadingState message="Loading review queue..." />
  if (query.isError) return <ErrorState message="Failed to load question queue." onRetry={() => void query.refetch()} />

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-xl font-semibold text-text-main">Question Review Queue</h2>
        <p className="text-sm text-text-main/70">Review and moderate pending question submissions.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No pending questions" description="All questions are reviewed." />
      ) : (
        <>
          <div className="grid gap-3">
            {rows.map((question) => (
              <Card key={question.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="default">{question.type}</Badge>
                    <Badge tone="warning">{question.difficulty_level}</Badge>
                  </div>
                  <Badge tone="default">{question.bloom_level}</Badge>
                </div>
                <p className="mt-3 text-sm text-text-main">{truncate(question.stem, 220)}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        await reviewMutation.mutateAsync({ id: question.id, status: 'APPROVED' })
                        toast.success('Question approved.')
                      } catch {
                        toast.error('Failed to approve question.')
                      }
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="warning"
                    onClick={async () => {
                      try {
                        await reviewMutation.mutateAsync({ id: question.id, status: 'REJECTED' })
                        toast.success('Question rejected.')
                      } catch {
                        toast.error('Failed to reject question.')
                      }
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={meta?.page ?? 1} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
        </>
      )}
    </Card>
  )
}
