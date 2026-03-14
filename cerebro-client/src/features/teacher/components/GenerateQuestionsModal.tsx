import { useState } from 'react'
import { Check, LoaderCircle, Sparkles } from 'lucide-react'
import { AiBadge } from '@/components/shared/AiBadge'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { cn } from '@/utils/cn'
import {
  useCurriculumLearningObjectives,
  useCurriculumSubjects,
  useCurriculumTopics,
  useGenerateQuestions,
  useGenerationJobStatus,
} from '../hooks/useTeacherData'

interface GenerateQuestionsModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

type ModalStep = 'form' | 'generating' | 'success' | 'error'

interface FormState {
  subjectId: string
  topicId: string
  learningObjectiveId: string
  questionType: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD'
  count: number
}

const DEFAULT_FORM: FormState = {
  subjectId: '',
  topicId: '',
  learningObjectiveId: '',
  questionType: 'MCQ',
  difficultyLevel: 'MEDIUM',
  count: 5,
}

function useGenerateFlow(onReset: () => void) {
  const [step, setStep] = useState<ModalStep>('form')
  const [jobId, setJobId] = useState<string | null>(null)
  const generateMutation = useGenerateQuestions()
  const jobQuery = useGenerationJobStatus(jobId)

  const jobStatus = jobQuery.data?.status
  const generatedCount = jobQuery.data?.result_question_ids?.length ?? 0
  const errorMessage = jobQuery.data?.error_message ?? 'An error occurred during generation.'

  if (step === 'generating' && jobStatus === 'COMPLETED') setStep('success')
  if (step === 'generating' && jobStatus === 'FAILED') setStep('error')

  async function startGeneration(form: FormState) {
    try {
      const result = await generateMutation.mutateAsync({
        learning_objective_id: form.learningObjectiveId,
        question_type: form.questionType,
        difficulty_level: form.difficultyLevel,
        count: form.count,
      })
      setJobId(result.job_id)
      setStep('generating')
    } catch {
      setStep('error')
    }
  }

  function reset() {
    setStep('form')
    setJobId(null)
    onReset()
  }

  return { step, jobStatus, generatedCount, errorMessage, startGeneration, reset }
}

export function GenerateQuestionsModal({ open, onClose, onComplete }: GenerateQuestionsModalProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  const subjectsQuery = useCurriculumSubjects()
  const topicsQuery = useCurriculumTopics(form.subjectId)
  const losQuery = useCurriculumLearningObjectives(form.topicId)

  const subjects = subjectsQuery.data ?? []
  const topics = topicsQuery.data ?? []
  const los = losQuery.data ?? []

  function handleReset() {
    setForm(DEFAULT_FORM)
  }

  const { step, generatedCount, errorMessage, startGeneration, reset } = useGenerateFlow(handleReset)

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubjectChange(subjectId: string) {
    setForm((prev) => ({ ...prev, subjectId, topicId: '', learningObjectiveId: '' }))
  }

  function handleTopicChange(topicId: string) {
    setForm((prev) => ({ ...prev, topicId, learningObjectiveId: '' }))
  }

  const isFormValid = Boolean(form.learningObjectiveId)

  return (
    <Modal open={open} onClose={handleClose} title="Generate Questions with AI">
      {step === 'form' && (
        <div className="space-y-4">
          <p className="text-sm text-text-main/70">
            Select a learning objective and configure the generation parameters. The AI will create
            questions aligned to your curriculum.
          </p>
          <FormField label="Subject">
            <Select
              value={form.subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Topic">
            <Select
              value={form.topicId}
              onChange={(e) => handleTopicChange(e.target.value)}
              disabled={!form.subjectId}
            >
              <option value="">Select topic...</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Learning Objective">
            <Select
              value={form.learningObjectiveId}
              onChange={(e) => setForm((prev) => ({ ...prev, learningObjectiveId: e.target.value }))}
              disabled={!form.topicId}
            >
              <option value="">Select learning objective...</option>
              {los.map((lo) => (
                <option key={lo.id} value={lo.id}>
                  {lo.title}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Question Type">
            <Select
              value={form.questionType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  questionType: e.target.value as FormState['questionType'],
                }))
              }
            >
              <option value="MCQ">MCQ</option>
              <option value="MULTI_SELECT">Multi-Select</option>
              <option value="SHORT_ANSWER">Short Answer</option>
            </Select>
          </FormField>
          <FormField label="Difficulty">
            <Select
              value={form.difficultyLevel}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  difficultyLevel: e.target.value as FormState['difficultyLevel'],
                }))
              }
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </FormField>
          <FormField label="Number of Questions" hint="Between 1 and 20">
            <Input
              type="number"
              min={1}
              max={20}
              value={form.count}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, count: Math.min(20, Math.max(1, Number(e.target.value))) }))
              }
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => void startGeneration(form)}
              disabled={!isFormValid}
              className="gap-2"
            >
              <Sparkles size={14} />
              Generate
            </Button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex items-center gap-2">
            <AiBadge />
            <LoaderCircle size={18} className="animate-spin text-brand-primary" />
          </div>
          <p className="font-semibold text-text-main">Generating {form.count} questions...</p>
          <p className="text-sm text-text-main/70">
            The AI is creating curriculum-aligned questions. This may take a moment.
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full bg-brand-primary',
                  i === 0 && 'animate-bounce [animation-delay:0ms]',
                  i === 1 && 'animate-bounce [animation-delay:150ms]',
                  i === 2 && 'animate-bounce [animation-delay:300ms]',
                )}
              />
            ))}
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check size={24} className="text-green-700" />
          </div>
          <div>
            <p className="font-semibold text-text-main">
              Generated {generatedCount} question{generatedCount !== 1 ? 's' : ''}!
            </p>
            <p className="mt-1 text-sm text-text-main/70">
              The new questions are now available in your question bank.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                reset()
              }}
            >
              Generate More
            </Button>
            <Button
              onClick={() => {
                reset()
                onComplete()
              }}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <p className="font-semibold text-status-error">Generation Failed</p>
          <p className="text-sm text-text-main/70">{errorMessage}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                reset()
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
