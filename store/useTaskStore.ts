'use client'

import { create } from 'zustand'

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string | null
  order: number
  projectId: string
  sectionId: string | null
  ownerId: string
  assigneeId: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string | null
    avatar: string | null
  }
  assignee: {
    id: string
    name: string | null
    avatar: string | null
  } | null
  project: {
    id: string
    name: string
    color: string
  }
  section: {
    id: string
    name: string
  } | null
  subtasks: {
    id: string
    title: string
    completed: boolean
  }[]
  tags: {
    id: string
    name: string
    color: string
  }[]
  _count: {
    comments: number
    subtasks: number
  }
}

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  selectedTask: Task | null
  
  // Actions
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
          'Authorization': `Bearer ${token}`,
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
        isLoading: false 
      })
    }
  },
  
  createTask: async (taskData) => {
    try {
      const token = localStorage.getItem('accessToken');
      let ownerId = undefined;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          ownerId = payload.userId;
        } catch {}
      }
      const fullTaskData = { ...taskData, ownerId };
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(fullTaskData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
      const task = await response.json();
      set(state => ({ 
        tasks: [...state.tasks, task],
        error: null 
      }));
      return task;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create task' });
      return null;
    }
  },
  
  updateTask: async (id, data) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }
      
      const updatedTask = await response.json()
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id ? updatedTask : task
        ),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        error: null
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
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        error: null
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
      completedAt: completed ? new Date().toISOString() : null 
    })
  },
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  clearError: () => set({ error: null }),
}))
