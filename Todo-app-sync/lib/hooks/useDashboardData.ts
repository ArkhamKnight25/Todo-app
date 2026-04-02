'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  completedTasks: number
  inProgressTasks: number
  dueTodayTasks: number
  productivity: number
}

interface RecentActivity {
  id: string
  title: string
  description: string
  icon: 'check' | 'clock' | 'plus' | 'task'
  timestamp: string
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    completedTasks: 0,
    inProgressTasks: 0,
    dueTodayTasks: 0,
    productivity: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('No authentication token')
        return
      }

      // Fetch tasks to calculate stats
      const tasksResponse = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const tasks = await tasksResponse.json()
      
      // Calculate stats
      const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length
      const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      const dueToday = tasks.filter((t: any) => 
        t.dueDate && new Date(t.dueDate) <= today && t.status !== 'COMPLETED'
      ).length
      
      const productivity = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

      setStats({
        completedTasks: completed,
        inProgressTasks: inProgress,
        dueTodayTasks: dueToday,
        productivity,
      })

      // Mock recent activity for now
      setRecentActivity([
        {
          id: '1',
          title: 'Task completed',
          description: 'You completed a task',
          icon: 'check',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'New task created',
          description: 'A new task was added',
          icon: 'plus',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    stats,
    recentActivity,
    loading,
    error,
    refresh: fetchDashboardData,
  }
}