'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Calendar, TrendingUp, Plus, List, FolderOpen, Home } from 'lucide-react'
import TaskList from '../../components/tasks/TaskList'
import { ProjectList } from '../../components/projects'
import ThemeToggle from '../../components/ui/ThemeToggle'
import { useDashboardData } from '../../lib/hooks/useDashboardData'

type ViewMode = 'overview' | 'tasks' | 'projects'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewMode>('overview')
  const { stats, recentActivity, loading: dashboardLoading, error: dashboardError, refresh } = useDashboardData()

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view)
    // Refresh dashboard data when returning to overview
    if (view === 'overview' && refresh) {
      refresh()
    }
  }

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    // TODO: Verify token and get user data
    // For now, just simulate user data
    setUser({ name: 'User', email: 'user@example.com' })
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">TaskFlow Dashboard</h1>
              
              {/* Navigation */}
              <nav className="flex space-x-4">
                <button
                  onClick={() => handleViewChange('overview')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'overview'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Home className="h-4 w-4 mr-1 inline" />
                  Overview
                </button>
                <button
                  onClick={() => handleViewChange('tasks')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'tasks'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <List className="h-4 w-4 mr-1 inline" />
                  Tasks
                </button>
                <button
                  onClick={() => handleViewChange('projects')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'projects'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <FolderOpen className="h-4 w-4 mr-1 inline" />
                  Projects
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-sm text-gray-700 dark:text-gray-300">Welcome back!</span>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken')
                  localStorage.removeItem('refreshToken')
                  router.push('/login')
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'overview' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/10 p-6 border dark:border-gray-700 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {dashboardLoading ? '-' : stats.completedTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/10 p-6 border dark:border-gray-700 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {dashboardLoading ? '-' : stats.inProgressTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/10 p-6 border dark:border-gray-700 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Today</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {dashboardLoading ? '-' : stats.dueTodayTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/10 p-6 border dark:border-gray-700 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Productivity</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {dashboardLoading ? '-' : `${stats.productivity}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/10 p-6 mb-8 border dark:border-gray-700 transition-colors">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => handleViewChange('tasks')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Task</span>
                </button>
                <button 
                  onClick={() => handleViewChange('projects')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Project</span>
                </button>
                <button className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Calendar</span>
                </button>
                <button className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                  <TrendingUp className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/10 p-6 border dark:border-gray-700 transition-colors">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
              
              {dashboardError && (
                <div className="text-center py-8">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">Session Expired</h3>
                    <p className="text-red-600 dark:text-red-400 text-sm mb-3">
                      Your session has expired. Please log in again to continue.
                    </p>
                    <button
                      onClick={() => window.location.href = '/login?expired=true'}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              )}
              
              {dashboardLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.icon === 'check' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {activity.icon === 'clock' && <Clock className="h-5 w-5 text-blue-600" />}
                        {activity.icon === 'plus' && <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
                        {activity.icon === 'task' && <List className="h-5 w-5 text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{activity.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Start creating tasks and projects to see activity here
                  </p>
                </div>
              )}
            </div>
          </>
        ) : currentView === 'tasks' ? (
          /* Task Management View */
          <TaskList />
        ) : (
          /* Projects View */
          <ProjectList />
        )}
      </main>
    </div>
  )
}
