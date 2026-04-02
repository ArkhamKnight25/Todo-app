'use client'

import { create } from 'zustand'
import type { Task } from '@/types'

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  selectedTask: Task | null
  fetchTasks: (projectId?: string) => Promise<void>
  createTask: (task: {
    title: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    dueDate?: string
    projectId?: string
  }) => Promise<Task | null>
  updateTask: (id: string, data: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  completeTask: (id: string, completed: boolean) => Promise<Task | null>
  setSelectedTask: (task: Task | null) => void
  clearError: () => void
}

export type { Task }

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  selectedTask: null,

  fetchTasks: async (projectId?: string) => {
    set({ isLoading: true, error: null })

    try {
      const token = localStorage.getItem('accessToken')
      const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      set({ tasks: data, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      })
    }
  },

  createTask: async (taskData) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const task = await response.json()
      set((state) => ({
        tasks: [...state.tasks, task],
        error: null,
      }))
      return task
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create task' })
      return null
    }
  },

  updateTask: async (id, data) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const updatedTask = await response.json()
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updatedTask : task)),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        error: null,
      }))

      return updatedTask
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update task' })
      return null
    }
  },

  deleteTask: async (id) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        error: null,
      }))

      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' })
      return false
    }
  },

  completeTask: async (id, completed) => {
    const status = completed ? 'COMPLETED' : 'TODO'
    return get().updateTask(id, {
      status,
      completedAt: completed ? new Date().toISOString() : null,
    } as Partial<Task>)
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  clearError: () => set({ error: null }),
}))
