import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import {
  useCreateCurriculumLearningObjective,
  useCreateCurriculumTopic,
  useCurriculumLearningObjectives,
  useCurriculumSubjects,
  useCurriculumTopics,
  useDeleteCurriculumLearningObjective,
  useDeleteCurriculumTopic,
} from '../hooks/useTeacherData'

export default function CurriculumPage() {
  const toast = useToast()
  const subjectsQuery = useCurriculumSubjects()
  const [subjectId, setSubjectId] = useState('')
  const [topicId, setTopicId] = useState('')

  // Panel states
  const [topicPanelOpen, setTopicPanelOpen] = useState(false)
  const [loPanelOpen, setLoPanelOpen] = useState(false)

  // Topic form — includes its own subject dropdown
  const [topicForm, setTopicForm] = useState({
    subjectId: '',
    name: '',
    description: '',
    order_index: '0',
  })

  // LO form — includes its own subject + topic dropdowns
  const [loForm, setLoForm] = useState({
    subjectId: '',
    topicId: '',
    title: '',
    description: '',
    bloom_level: 'APPLY' as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
    order_index: '0',
  })

  const subjects = subjectsQuery.data ?? []
  const mathSubject = subjects.find((s) => s.name.toLowerCase().includes('mathematic'))
  const defaultSubjectId = mathSubject?.id ?? subjects[0]?.id ?? ''

  const selectedSubjectId = subjectId || defaultSubjectId
  const topicsQuery = useCurriculumTopics(selectedSubjectId)
  const topics = topicsQuery.data ?? []
  const selectedTopicId = topicId || topics[0]?.id || ''
  const learningObjectivesQuery = useCurriculumLearningObjectives(selectedTopicId)
  const learningObjectives = learningObjectivesQuery.data ?? []

  // Topics for the LO panel's selected subject
  const loSubjectId = loForm.subjectId || defaultSubjectId
  const loTopicsQuery = useCurriculumTopics(loSubjectId)
  const loTopics = loTopicsQuery.data ?? []

  const createTopicMutation = useCreateCurriculumTopic()
  const deleteTopicMutation = useDeleteCurriculumTopic(selectedSubjectId)
  const createLoMutation = useCreateCurriculumLearningObjective()
  const deleteLoMutation = useDeleteCurriculumLearningObjective(selectedTopicId)

  if (subjectsQuery.isLoading) return <LoadingState message="Loading curriculum..." />
  if (subjectsQuery.isError) return <ErrorState message="Failed to load subjects." onRetry={() => void subjectsQuery.refetch()} />

  function openTopicPanel() {
    setTopicForm({
      subjectId: selectedSubjectId || defaultSubjectId,
      name: '',
      description: '',
      order_index: '0',
    })
    setTopicPanelOpen(true)
  }

  function openLoPanel() {
    setLoForm({
      subjectId: selectedSubjectId || defaultSubjectId,
      topicId: selectedTopicId,
      title: '',
      description: '',
      bloom_level: 'APPLY',
      order_index: '0',
    })
    setLoPanelOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-xl font-semibold text-text-main">Curriculum</h2>
        <p className="text-sm text-text-main/70">Manage subjects, topics, and learning objectives.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Subjects column */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-text-main">Subjects</h3>
          </div>
          {subjects.length === 0 ? (
            <EmptyState title="No subjects found" />
          ) : (
            <div className="space-y-2">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${selectedSubjectId === subject.id ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-brand-blue/15 bg-white text-text-main'}`}
                  onClick={() => {
                    setSubjectId(subject.id)
                    setTopicId('')
                  }}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Topics column */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-text-main">Topics</h3>
            <Button onClick={openTopicPanel} disabled={!selectedSubjectId}>
              Add
            </Button>
          </div>
          {topicsQuery.isLoading ? (
            <LoadingState message="Loading topics..." />
          ) : topics.length === 0 ? (
            <EmptyState title="No topics found" />
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => (
                <div key={topic.id} className="rounded-lg border border-brand-blue/15 bg-white p-2">
                  <button
                    type="button"
                    className={`w-full text-left text-sm ${selectedTopicId === topic.id ? 'text-brand-blue font-semibold' : 'text-text-main'}`}
                    onClick={() => setTopicId(topic.id)}
                  >
                    {topic.name}
                  </button>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="danger"
                      onClick={async () => {
                        try {
                          await deleteTopicMutation.mutateAsync(topic.id)
                          toast.success('Topic deleted.')
                        } catch {
                          toast.error('Failed to delete topic.')
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Learning Objectives column */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-text-main">Learning Objectives</h3>
            <Button onClick={openLoPanel} disabled={!selectedTopicId}>
              Add
            </Button>
          </div>
          {learningObjectivesQuery.isLoading ? (
            <LoadingState message="Loading learning objectives..." />
          ) : learningObjectives.length === 0 ? (
            <EmptyState title="No learning objectives found" />
          ) : (
            <div className="space-y-2">
              {learningObjectives.map((learningObjective) => (
                <div key={learningObjective.id} className="rounded-lg border border-brand-blue/15 bg-white p-2">
                  <p className="text-xs text-text-main/70">{learningObjective.bloom_level}</p>
                  <p className="text-sm font-semibold text-text-main">{learningObjective.title}</p>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="danger"
                      onClick={async () => {
                        try {
                          await deleteLoMutation.mutateAsync(learningObjective.id)
                          toast.success('Learning objective deleted.')
                        } catch {
                          toast.error('Failed to delete learning objective.')
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      </div>

      {/* ── Add Topic Panel ──────────────────────────────── */}
      <SlidePanel
        open={topicPanelOpen}
        onClose={() => setTopicPanelOpen(false)}
        title="Add Topic"
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              await createTopicMutation.mutateAsync({
                subjectId: topicForm.subjectId,
                payload: {
                  name: topicForm.name,
                  description: topicForm.description || undefined,
                  order_index: Number(topicForm.order_index) || 0,
                },
              })
              toast.success('Topic created.')
              setTopicPanelOpen(false)
            } catch {
              toast.error('Failed to create topic.')
            }
          }}
        >
          <FormField label="Subject">
            <Select
              value={topicForm.subjectId}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Topic Name">
            <Input
              value={topicForm.name}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={topicForm.description}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </FormField>
          <FormField label="Order Index">
            <Input
              type="number"
              value={topicForm.order_index}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, order_index: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={() => setTopicPanelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTopicMutation.isPending}>
              {createTopicMutation.isPending ? 'Creating...' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      {/* ── Add Learning Objective Panel ──────────────────── */}
      <SlidePanel
        open={loPanelOpen}
        onClose={() => setLoPanelOpen(false)}
        title="Add Learning Objective"
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              await createLoMutation.mutateAsync({
                topicId: loForm.topicId,
                payload: {
                  title: loForm.title,
                  description: loForm.description || undefined,
                  bloom_level: loForm.bloom_level,
                  order_index: Number(loForm.order_index) || 0,
                },
              })
              toast.success('Learning objective created.')
              setLoPanelOpen(false)
            } catch {
              toast.error('Failed to create learning objective.')
            }
          }}
        >
          <FormField label="Subject">
            <Select
              value={loForm.subjectId}
              onChange={(e) => setLoForm((prev) => ({ ...prev, subjectId: e.target.value, topicId: '' }))}
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Topic">
            <Select
              value={loForm.topicId}
              onChange={(e) => setLoForm((prev) => ({ ...prev, topicId: e.target.value }))}
              required
            >
              <option value="">Select a topic</option>
              {loTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Title">
            <Input
              value={loForm.title}
              onChange={(e) => setLoForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={loForm.description}
              onChange={(e) => setLoForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </FormField>
          <FormField label="Bloom Level">
            <Select
              value={loForm.bloom_level}
              onChange={(e) => setLoForm((prev) => ({ ...prev, bloom_level: e.target.value as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE' }))}
            >
              <option value="REMEMBER">Remember</option>
              <option value="UNDERSTAND">Understand</option>
              <option value="APPLY">Apply</option>
              <option value="ANALYZE">Analyze</option>
              <option value="EVALUATE">Evaluate</option>
              <option value="CREATE">Create</option>
            </Select>
          </FormField>
          <FormField label="Order Index">
            <Input
              type="number"
              value={loForm.order_index}
              onChange={(e) => setLoForm((prev) => ({ ...prev, order_index: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={() => setLoPanelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLoMutation.isPending || !loForm.topicId}>
              {createLoMutation.isPending ? 'Creating...' : 'Create Learning Objective'}
            </Button>
          </div>
        </form>
      </SlidePanel>
    </>
  )
}
