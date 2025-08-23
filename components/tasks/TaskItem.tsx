'use client'

import React from 'react'
import { Edit, Check, Clock, Calendar, Flag, User } from 'lucide-react'

interface TaskItemProps {
  task: {
    id: string
    title: string
    description?: string | null
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    dueDate?: string | null
    project?: { name: string; color: string } | null
    assignee?: { id: string; name: string | null; avatar: string | null } | null
  }
  onComplete: (id: string, completed: boolean) => void
  onEdit: (task: any) => void
}

export default function TaskItem({ task, onComplete, onEdit }: TaskItemProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'URGENT': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'text-gray-600 bg-gray-50'
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50'
      case 'REVIEW': return 'text-yellow-600 bg-yellow-50'
      case 'COMPLETED': return 'text-green-600 bg-green-50'
      case 'ARCHIVED': return 'text-gray-500 bg-gray-100'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => onComplete(task.id, task.status !== 'COMPLETED')}
              className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center ${
                task.status === 'COMPLETED' 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {task.status === 'COMPLETED' && <Check className="h-3 w-3" />}
            </button>
            
            <h3 className={`font-medium text-gray-900 dark:text-gray-100 ${
              task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''
            }`}>
              {task.title}
            </h3>
            
            <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          
          {task.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            {task.project && (
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
                <span>{task.project.name}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {task.assignee && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{task.assignee.name || `User ${task.assignee.id.slice(0, 8)}`}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}