'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import TaskModal from '@/components/tasks/TaskModal'
import type { Project, Section, Task, TaskPriority, TaskStatus } from '@/types'

interface ProjectBoardProps {
  projectId: string
}

const STATUSES: Array<{ key: TaskStatus; label: string }> = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ARCHIVED', label: 'Archived' },
]

function priorityBorder(priority: TaskPriority) {
  switch (priority) {
    case 'LOW':
      return 'border-l-emerald-400'
    case 'MEDIUM':
      return 'border-l-sky-400'
    case 'HIGH':
      return 'border-l-amber-400'
    case 'URGENT':
      return 'border-l-rose-500'
    default:
      return 'border-l-gray-300'
  }
}

function statusTone(status: TaskStatus) {
  switch (status) {
    case 'TODO':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    case 'REVIEW':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'ARCHIVED':
      return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-xl border border-gray-200 border-l-4 bg-white p-4 shadow-sm transition active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900 ${
        priorityBorder(task.priority)
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
          {task.description && (
            <p className="mt-2 line-clamp-3 text-xs text-gray-600 dark:text-gray-400">{task.description}</p>
          )}
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusTone(task.status)}`}>
          {task.priority}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
              {(task.assignee.name || task.assignee.email || '?').slice(0, 1).toUpperCase()}
            </span>
          )}
          {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          {task._count.comments > 0 && <span>{task._count.comments} comments</span>}
          {task._count.attachments > 0 && <span>{task._count.attachments} files</span>}
        </div>
      </div>
    </div>
  )
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 border-l-4 bg-white p-4 shadow-lg ring-2 ring-blue-300/60 dark:border-gray-700 dark:bg-gray-900 ${
        priorityBorder(task.priority)
      }`}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
      {task.description && (
        <p className="mt-2 line-clamp-3 text-xs text-gray-600 dark:text-gray-400">{task.description}</p>
      )}
    </div>
  )
}

function BoardColumn({
  status,
  tasks,
  onAddTask,
}: {
  status: { key: TaskStatus; label: string }
  tasks: Task[]
  onAddTask: (status: TaskStatus) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: status.key,
  })

  return (
    <div
      ref={setNodeRef}
      className={`w-80 flex-shrink-0 rounded-2xl border p-4 transition-colors dark:border-gray-700 ${
        isOver ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-950/30' : 'border-gray-200 bg-gray-50/70 dark:bg-gray-800/80'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{status.label}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{tasks.length} tasks</p>
        </div>
        <button
          onClick={() => onAddTask(status.key)}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-blue-600 dark:hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
          <button
            onClick={() => onAddTask(status.key)}
            className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
          >
            Add task
          </button>
        </div>
      </SortableContext>
    </div>
  )
}

export default function ProjectBoard({ projectId }: ProjectBoardProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const firstSectionId = sections[0]?.id

  const columnTasks = useMemo(
    () =>
      STATUSES.reduce<Record<TaskStatus, Task[]>>(
        (acc, status) => {
          acc[status.key] = tasks
            .filter((task) => task.status === status.key)
            .sort((a, b) => a.order - b.order || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          return acc
        },
        {
          TODO: [],
          IN_PROGRESS: [],
          REVIEW: [],
          COMPLETED: [],
          ARCHIVED: [],
        }
      ),
    [tasks]
  )

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('accessToken')

      if (!token) {
        router.push('/login')
        return
      }

      const [projectResponse, sectionsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/projects/${projectId}/sections`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (projectResponse.status === 401 || sectionsResponse.status === 401) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        router.push('/login?expired=true')
        return
      }

      if (!projectResponse.ok || !sectionsResponse.ok) {
        const projectError = await projectResponse.json().catch(() => ({}))
        const sectionsError = await sectionsResponse.json().catch(() => ({}))
        throw new Error(projectError.error || sectionsError.error || 'Failed to load project board')
      }

      const projectData = await projectResponse.json()
      const sectionsData = await sectionsResponse.json()
      const nextSections = sectionsData.sections || []

      setProject(projectData.project)
      setSections(nextSections)
      setTasks(nextSections.flatMap((section: Section) => section.tasks || []))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load project board')
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  const openCreateTask = (status: TaskStatus) => {
    setCreateStatus(status)
    setIsTaskModalOpen(true)
  }

  const persistBoard = async (nextTasks: Task[]) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const updates = STATUSES.flatMap((status) =>
      nextTasks
        .filter((task) => task.status === status.key)
        .sort((a, b) => a.order - b.order)
        .map((task, index) =>
          fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: status.key,
              order: index,
              sectionId: task.sectionId || firstSectionId || null,
              completedAt: status.key === 'COMPLETED' ? task.completedAt || new Date().toISOString() : null,
            }),
          })
        )
    )

    const responses = await Promise.all(updates)
    if (responses.some((response) => !response.ok)) {
      throw new Error('Failed to save board changes')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((item) => item.id === String(event.active.id)) || null
    setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const activeTaskItem = tasks.find((task) => task.id === String(active.id))
    if (!activeTaskItem) {
      return
    }

    const overTaskItem = tasks.find((task) => task.id === String(over.id))
    const destinationStatus =
      overTaskItem?.status ||
      (STATUSES.some((item) => item.key === over.id) ? (over.id as TaskStatus) : activeTaskItem.status)

    const sourceColumn = columnTasks[activeTaskItem.status]
    const destinationColumn = columnTasks[destinationStatus]
    const sourceIndex = sourceColumn.findIndex((task) => task.id === activeTaskItem.id)
    const destinationIndex = overTaskItem
      ? destinationColumn.findIndex((task) => task.id === overTaskItem.id)
      : destinationColumn.length

    let nextTasks = [...tasks]

    if (activeTaskItem.status === destinationStatus) {
      const reordered = arrayMove(sourceColumn, sourceIndex, destinationIndex).map((task, index) => ({
        ...task,
        order: index,
      }))

      nextTasks = nextTasks.map((task) => reordered.find((item) => item.id === task.id) || task)
    } else {
      const updatedActiveTask = {
        ...activeTaskItem,
        status: destinationStatus,
        sectionId: activeTaskItem.sectionId || firstSectionId || null,
        completedAt: destinationStatus === 'COMPLETED' ? new Date().toISOString() : null,
      }

      const sourceWithoutActive = sourceColumn.filter((task) => task.id !== activeTaskItem.id).map((task, index) => ({
        ...task,
        order: index,
      }))
      const destinationWithoutActive = destinationColumn.filter((task) => task.id !== activeTaskItem.id)
      const reorderedDestination = [
        ...destinationWithoutActive.slice(0, destinationIndex),
        updatedActiveTask,
        ...destinationWithoutActive.slice(destinationIndex),
      ].map((task, index) => ({
        ...task,
        order: index,
      }))

      nextTasks = nextTasks
        .filter((task) => task.id !== activeTaskItem.id && task.status !== activeTaskItem.status && task.status !== destinationStatus)
        .concat(sourceWithoutActive, reorderedDestination)
    }

    setTasks(nextTasks)

    try {
      await persistBoard(nextTasks)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save board changes')
      fetchBoard()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
        <p className="font-medium">{error}</p>
        <button onClick={fetchBoard} className="mt-3 text-sm font-medium underline">
          Try again
        </button>
      </div>
    )
  }

  if (!project) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400">Project not found.</div>
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white"
                style={{ backgroundColor: project.color }}
              >
                {project.icon?.slice(0, 2) || project.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {project.description || 'No description yet.'}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  {sections.length} sections available
                </p>
              </div>
            </div>
            <button
              onClick={() => openCreateTask('TODO')}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <BoardColumn
                key={status.key}
                status={status}
                tasks={columnTasks[status.key]}
                onAddTask={openCreateTask}
              />
            ))}
          </div>
          <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </div>

      {isTaskModalOpen && (
        <TaskModal
          projectId={projectId}
          sectionId={firstSectionId}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={() => {
            setIsTaskModalOpen(false)
            fetchBoard()
          }}
          task={{
            id: '',
            title: '',
            description: '',
            status: createStatus,
            priority: 'MEDIUM',
            dueDate: null,
            order: 0,
            projectId,
            sectionId: firstSectionId || null,
            ownerId: '',
            assigneeId: null,
            completedAt: null,
            createdAt: '',
            updatedAt: '',
            owner: { id: '', name: null },
            assignee: null,
            project,
            section: firstSectionId ? { id: firstSectionId, name: sections[0]?.name || 'Backlog', order: 0 } : null,
            subtasks: [],
            tags: [],
            _count: { comments: 0, subtasks: 0, attachments: 0 },
          }}
        />
      )}
    </>
  )
}
