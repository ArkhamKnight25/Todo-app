'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project, Section, Task } from '@/types';

interface ProjectBoardProps {
  projectId: string;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ projectId }) => {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project');
      }

      const projectData = await projectResponse.json();
      setProject(projectData.project);

      // Fetch sections
      const sectionsResponse = await fetch(`/api/projects/${projectId}/sections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!sectionsResponse.ok) {
        throw new Error('Failed to fetch sections');
      }

      const sectionsData = await sectionsResponse.json();
      setSections(sectionsData.sections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: Task['status']) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'border-l-green-400';
      case 'MEDIUM':
        return 'border-l-yellow-400';
      case 'HIGH':
        return 'border-l-orange-400';
      case 'URGENT':
        return 'border-l-red-400';
      default:
        return 'border-l-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchProject}
              className="mt-2 text-red-600 hover:text-red-500 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600">{project.description}</p>
            )}
          </div>
          {project.icon && (
            <span className="text-2xl">{project.icon}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-6 overflow-x-auto pb-6">
        {sections.map((section) => (
          <div key={section.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-50 rounded-lg p-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{section.name}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {section._count?.tasks || 0}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {section.tasks?.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white rounded-lg p-3 border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(task.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 text-xs mb-2 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {task.assignee && (
                          <div className="flex items-center space-x-1">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                              {task.assignee.name?.[0] || task.assignee.email[0]}
                            </div>
                          </div>
                        )}
                        {task.dueDate && (
                          <span>
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {task._count && (
                          <>
                            {task._count.comments > 0 && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{task._count.comments}</span>
                              </span>
                            )}
                            {task._count.attachments > 0 && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span>{task._count.attachments}</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Task to Section */}
                <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm">
                  + Add task
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Section */}
        <div className="flex-shrink-0 w-80">
          <button className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Section</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectBoard;
