'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  completedTasks: number;
  inProgressTasks: number;
  dueTodayTasks: number;
  productivity: number;
}

interface RecentActivity {
  id: string;
  type: 'task_completed' | 'task_started' | 'project_created' | 'task_created';
  title: string;
  description: string;
  timestamp: Date;
  icon: 'check' | 'clock' | 'plus' | 'task';
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useDashboardData = (): DashboardData => {
  const [stats, setStats] = useState<DashboardStats>({
    completedTasks: 0,
    inProgressTasks: 0,
    dueTodayTasks: 0,
    productivity: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Fetch tasks to calculate stats
      const tasksResponse = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await tasksResponse.json();

      // Calculate stats from tasks
      const now = new Date();
      const today = now.toDateString();

      const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
      const inProgressTasks = tasks.filter((task: any) => task.status === 'in-progress').length;
      const dueTodayTasks = tasks.filter((task: any) => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate).toDateString() === today;
      }).length;

      // Calculate productivity (completed tasks in last 7 days / total tasks created in last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentTasks = tasks.filter((task: any) => new Date(task.createdAt) > sevenDaysAgo);
      const recentCompleted = recentTasks.filter((task: any) => task.status === 'completed').length;
      const productivity = recentTasks.length > 0 ? Math.round((recentCompleted / recentTasks.length) * 100) : 0;

      setStats({
        completedTasks,
        inProgressTasks,
        dueTodayTasks,
        productivity
      });

      // Generate recent activity from tasks and projects
      const activityItems: RecentActivity[] = [];

      // Add recent task completions
      const recentCompletedTasks = tasks
        .filter((task: any) => task.status === 'completed')
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);

      recentCompletedTasks.forEach((task: any) => {
        activityItems.push({
          id: `task-completed-${task.id}`,
          type: 'task_completed',
          title: `Task "${task.title}" completed`,
          description: getTimeAgo(new Date(task.updatedAt)),
          timestamp: new Date(task.updatedAt),
          icon: 'check'
        });
      });

      // Add recent task starts (in-progress)
      const recentStartedTasks = tasks
        .filter((task: any) => task.status === 'in-progress')
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 2);

      recentStartedTasks.forEach((task: any) => {
        activityItems.push({
          id: `task-started-${task.id}`,
          type: 'task_started',
          title: `Task "${task.title}" started`,
          description: getTimeAgo(new Date(task.updatedAt)),
          timestamp: new Date(task.updatedAt),
          icon: 'clock'
        });
      });

      // Fetch recent projects
      try {
        const projectsResponse = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (projectsResponse.ok) {
          const projects = await projectsResponse.json();
          const recentProjects = projects
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2);

          recentProjects.forEach((project: any) => {
            activityItems.push({
              id: `project-created-${project.id}`,
              type: 'project_created',
              title: `New project "${project.name}" created`,
              description: getTimeAgo(new Date(project.createdAt)),
              timestamp: new Date(project.createdAt),
              icon: 'plus'
            });
          });
        }
      } catch (projectError) {
        console.warn('Could not fetch projects for activity:', projectError);
      }

      // Sort all activities by timestamp and take the most recent 5
      const sortedActivity = activityItems
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      setRecentActivity(sortedActivity);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 5 minutes to keep data current
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    recentActivity,
    loading,
    error,
    refresh: fetchDashboardData
  };
};

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
