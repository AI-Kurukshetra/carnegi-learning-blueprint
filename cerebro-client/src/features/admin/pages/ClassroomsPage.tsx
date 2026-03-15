import { useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import GradesTab from './GradesTab'
import SectionsTab from './SectionsTab'
import ClassroomsTab from './ClassroomsTab'

const TABS = [
  { value: 'grades', label: 'Grades' },
  { value: 'sections', label: 'Sections' },
  { value: 'classrooms', label: 'Classrooms' },
]

export default function ClassroomsPage() {
  const [tab, setTab] = useState('grades')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Classroom Management</h1>
        <p className="mt-1 text-sm text-text-main/70">
          Set up your academic structure: first add grades, then sections within each grade, and finally create classrooms.
        </p>
      </div>

      <Tabs items={TABS} value={tab} onChange={setTab} />

      {tab === 'grades' && <GradesTab />}
      {tab === 'sections' && <SectionsTab />}
      {tab === 'classrooms' && <ClassroomsTab />}
    </div>
  )
}
