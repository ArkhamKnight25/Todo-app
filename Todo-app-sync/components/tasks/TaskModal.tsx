'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, Flag, User, Tag, AlignLeft, Clock } from 'lucide-react'
import type { ProjectSummary } from '@/types'
import type { Task } from '@/store/useTaskStore'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  sectionId: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskModalProps {
  task?: Task | null
  projectId?: string
  sectionId?: string
  onClose: () => void
  onSave: () => void
}

export default function TaskModal({ task, onClose, onSave, projectId, sectionId }: TaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      projectId: projectId || '',
      assigneeId: '',
      sectionId: sectionId || '',
    },
  })

  useEffect(() => {
    let active = true

    const loadProjects = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch('/api/projects', {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }

        const data = await response.json()
        if (!active) return

        const nextProjects = data.projects || []
        setProjects(nextProjects)

        if (!task && !projectId && nextProjects[0]?.id) {
          setValue('projectId', nextProjects[0].id)
        }
      } catch (error) {
        if (active) {
          setProjects([])
        }
      } finally {
        if (active) {
          setProjectsLoading(false)
        }
      }
    }

    loadProjects()
    return () => {
      active = false
    }
  }, [projectId, setValue, task])

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        projectId: task.projectId,
        assigneeId: task.assigneeId || '',
        sectionId: task.sectionId || sectionId || '',
      })
      return
    }

    reset({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      projectId: projectId || '',
      assigneeId: '',
      sectionId: sectionId || '',
    })
  }, [projectId, reset, sectionId, task])

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const payload = {
        projectId: data.projectId?.trim() || undefined,
        sectionId: data.sectionId?.trim() || undefined,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assigneeId: data.assigneeId?.trim() || undefined,
      }

      const isEditing = Boolean(task?.id)
      const taskId = task?.id
      const response = await fetch(isEditing && taskId ? `/api/tasks/${taskId}` : '/api/tasks', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save task' }))
        throw new Error(errorData.error || 'Failed to save task')
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const priorityColors = {
    LOW: 'text-blue-600 border-blue-200 bg-blue-50',
    MEDIUM: 'text-gray-600 border-gray-200 bg-gray-50',
    HIGH: 'text-orange-600 border-orange-200 bg-orange-50',
    URGENT: 'text-red-600 border-red-200 bg-red-50',
  }

  const statusColors = {
    TODO: 'text-gray-600 border-gray-200 bg-gray-50',
    IN_PROGRESS: 'text-blue-600 border-blue-200 bg-blue-50',
    REVIEW: 'text-yellow-600 border-yellow-200 bg-yellow-50',
    COMPLETED: 'text-green-600 border-green-200 bg-green-50',
    ARCHIVED: 'text-gray-600 border-gray-200 bg-gray-50',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {task?.id ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Task Title *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder="Enter task title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <AlignLeft className="mr-1 inline h-4 w-4" />
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder="Add a description..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Flag className="mr-1 inline h-4 w-4" />
                Priority
              </label>
              <select
                {...register('priority')}
                className={`w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${priorityColors[watch('priority') || 'MEDIUM']}`}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Clock className="mr-1 inline h-4 w-4" />
                Status
              </label>
              <select
                {...register('status')}
                className={`w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${statusColors[watch('status') || 'TODO']}`}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="mr-1 inline h-4 w-4" />
                Due Date
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
              <select
                {...register('projectId')}
                disabled={projectsLoading || projects.length === 0}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((projectOption) => (
                    <option key={projectOption.id} value={projectOption.id}>
                      {projectOption.name}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {projectsLoading ? 'Loading projects...' : 'Tasks are created inside the selected project'}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <User className="mr-1 inline h-4 w-4" />
              Assignee
            </label>
            <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Self-assigned for now
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Team assignment can be added later without breaking the task flow.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Tag className="mr-1 inline h-4 w-4" />
              Tags
            </label>
            <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Tag management still is not wired up
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : task?.id ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
