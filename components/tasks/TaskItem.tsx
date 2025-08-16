'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'
import { CheckCircle, Circle, Calendar, MessageSquare, Tag, User, MoreVertical } from 'lucide-react'
import { Task } from '../../store/useTaskStore'

interface TaskItemProps {
  task: Task
  onComplete: (id: string, completed: boolean) => void
  onEdit: (task: Task) => void
}

export default function TaskItem({ task, onComplete, onEdit }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const isCompleted = task.status === 'COMPLETED'
  const subtasksCompleted = task.subtasks.filter(st => st.completed).length
  const subtasksTotal = task.subtasks.length
  
  const priorityColors = {
    LOW: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    MEDIUM: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
  }
  
  const statusColors = {
    TODO: 'border-l-gray-300',
    IN_PROGRESS: 'border-l-blue-500',
    REVIEW: 'border-l-yellow-500',
    COMPLETED: 'border-l-green-500',
    ARCHIVED: 'border-l-gray-400',
  }
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComplete(task.id, !isCompleted)
  }
  
  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900/20 transition-all duration-200 cursor-pointer border-l-4 ${statusColors[task.status]} ${isCompleted ? 'opacity-75' : ''}`}
      onClick={() => onEdit(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-3">
        {/* Completion Button */}
        <button
          onClick={handleComplete}
          className="flex-shrink-0 mt-1 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400" />
          )}
        </button>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Priority */}
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-medium text-gray-900 dark:text-gray-100 ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            
            {/* Priority Badge */}
            {task.priority !== 'MEDIUM' && (
              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
            )}
          </div>
          
          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {/* Project */}
          <div className="flex items-center mb-2">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{task.project.name}</span>
          </div>
          
          {/* Meta Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              {/* Due Date */}
              {task.dueDate && (
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
              
              {/* Subtasks */}
              {subtasksTotal > 0 && (
                <span className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {subtasksCompleted}/{subtasksTotal}
                </span>
              )}
              
              {/* Comments */}
              {task._count.comments > 0 && (
                <span className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {task._count.comments}
                </span>
              )}
              
              {/* Tags */}
              {task.tags.length > 0 && (
                <span className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  {task.tags.length}
                </span>
              )}
            </div>
            
            {/* Assignee */}
            <div className="flex items-center space-x-2">
              {task.assignee && (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                    {task.assignee.avatar ? (
                      <Image 
                        src={task.assignee.avatar} 
                        alt={task.assignee.name || ''} 
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {task.assignee.name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* More Actions */}
              {isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: Show context menu
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
