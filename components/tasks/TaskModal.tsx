'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, Flag, User, Tag, AlignLeft, Clock } from 'lucide-react'
import { useTaskStore, Task } from '../../store/useTaskStore'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskModalProps {
  task?: Task | null
  onClose: () => void
  onSave: () => void
}

export default function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const { createTask, updateTask, isLoading } = useTaskStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      projectId: '',
      assigneeId: '',
    }
  })
  
  // Populate form when editing
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
      })
    }
  }, [task, reset])
  
  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    try {
      const taskData: any = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      }
      
      // Only include assigneeId if it's not empty
      if (data.assigneeId && data.assigneeId.trim() !== '') {
        taskData.assigneeId = data.assigneeId
      }
      
      // Only include projectId if it's not empty
      if (data.projectId && data.projectId.trim() !== '') {
        taskData.projectId = data.projectId
      }
      
      if (task) {
        await updateTask(task.id, taskData)
      } else {
        await createTask(taskData)
      }
      
      onSave()
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlignLeft className="inline h-4 w-4 mr-1" />
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a description..."
            />
          </div>
          
          {/* Priority and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="inline h-4 w-4 mr-1" />
                Priority
              </label>
              <select
                {...register('priority')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${priorityColors[watch('priority') || 'MEDIUM']}`}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Status
              </label>
              <select
                {...register('status')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${statusColors[watch('status') || 'TODO']}`}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          
          {/* Due Date and Project Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due Date
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Project - Placeholder for now */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Default Project
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Project selection will be available soon
              </p>
            </div>
          </div>
          
          {/* Assignee - Placeholder for now */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Assignee
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Self-assigned
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Team member assignment will be available soon
            </p>
          </div>
          
          {/* Tags - Placeholder for now */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              No tags
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Tag management will be available soon
            </p>
          </div>
          
          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
