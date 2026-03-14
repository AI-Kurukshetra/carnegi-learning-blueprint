import { useParams } from 'react-router-dom'
import { FeaturePlaceholder } from '@/components/shared/FeaturePlaceholder'

export default function QuestionBuilderPage() {
  const { id } = useParams()
  const modeLabel = id ? 'Edit Question' : 'Create Question'

  return (
    <FeaturePlaceholder
      title={modeLabel}
      description="Step-wise authoring for metadata, stem, options, and hints will be implemented with schema validation."
    />
  )
}
