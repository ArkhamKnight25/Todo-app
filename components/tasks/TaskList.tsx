'use client'

import { useState, useEffect } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import TaskItem from './TaskItem'
import TaskModal from './TaskModal'
import { Plus, Filter, Search, SortAsc } from 'lucide-react'

type ViewMode = 'list' | 'board' | 'calendar'
type FilterBy = 'all' | 'today' | 'overdue' | 'completed' | 'my-tasks'
type SortBy = 'created' | 'due-date' | 'priority' | 'alphabetical'

export default function TaskList() {
  const { 
    tasks, 
    isLoading, 
    error, 
    fetchTasks, 
    updateTask, 
    completeTask 
  } = useTaskStore()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [sortBy, setSortBy] = useState<SortBy>('created')
  const [viewMode] = useState<ViewMode>('list')
  
  // Load tasks on component mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])
  
  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.project.name.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter(task => {
      // Status filter
      switch (filterBy) {
        case 'today':
          const today = new Date()
          today.setHours(23, 59, 59, 999)
          return task.dueDate && new Date(task.dueDate) <= today && task.status !== 'COMPLETED'
        case 'overdue':
          const now = new Date()
          return task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED'
        case 'completed':
          return task.status === 'COMPLETED'
        case 'my-tasks':
          // TODO: Filter by current user when auth context is available
          return true
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'due-date':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'priority':
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        default: // 'created'
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  
  const handleCreateTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }
  
  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }
  
  const handleCompleteTask = async (id: string, completed: boolean) => {
    try {
      await completeTask(id, completed)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }
  
  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingTask(null)
  }
  
  const taskCounts = {
    all: tasks.length,
    today: tasks.filter(task => {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return task.dueDate && new Date(task.dueDate) <= today && task.status !== 'COMPLETED'
    }).length,
    overdue: tasks.filter(task => {
      const now = new Date()
      return task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED'
    }).length,
    completed: tasks.filter(task => task.status === 'COMPLETED').length,
    'my-tasks': tasks.length // TODO: Update when auth context is available
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={() => fetchTasks()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
        
        <button
          onClick={handleCreateTask}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filter Dropdown */}
        <div className="relative">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Tasks ({taskCounts.all})</option>
            <option value="today">Due Today ({taskCounts.today})</option>
            <option value="overdue">Overdue ({taskCounts.overdue})</option>
            <option value="completed">Completed ({taskCounts.completed})</option>
            <option value="my-tasks">My Tasks ({taskCounts['my-tasks']})</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created">Sort by Created</option>
            <option value="due-date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="alphabetical">Sort Alphabetically</option>
          </select>
          <SortAsc className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      
      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery || filterBy !== 'all' 
              ? 'No tasks match your criteria' 
              : 'No tasks yet'
            }
          </div>
          {!searchQuery && filterBy === 'all' && (
            <button
              onClick={handleCreateTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={handleCompleteTask}
              onEdit={handleEditTask}
            />
          ))}
        </div>
      )}
      
      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={handleModalClose}
          onSave={() => {
            fetchTasks() // Refresh the list
            handleModalClose()
          }}
        />
      )}
    </div>
  )
}
