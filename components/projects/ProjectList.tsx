'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

type ProjectWithExtras = Project & {
  workspaceName: string;
  _count: {
    tasks: number;
    sections: number;
  };
};

interface ProjectListProps {
  initialProjects?: ProjectWithExtras[];
}

const ProjectList: React.FC<ProjectListProps> = ({ initialProjects = [] }) => {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithExtras[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'tasks'>('updated');

  useEffect(() => {
    if (initialProjects.length === 0) {
      fetchProjects();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.code === 'TOKEN_EXPIRED') {
          // Clear expired tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/login');
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.code === 'TOKEN_EXPIRED') {
          // Clear expired tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/login');
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();
      setProjects(prev => [data.project, ...prev]);
      setIsModalOpen(false);
      
      // Navigate to the new project
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = React.useMemo(() => {
    let filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'updated':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'tasks':
        filtered.sort((a, b) => (b._count?.tasks || 0) - (a._count?.tasks || 0));
        break;
    }

    return filtered;
  }, [projects, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Project</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'updated' | 'tasks')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="updated">Recently Updated</option>
          <option value="name">Name</option>
          <option value="tasks">Task Count</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-2 text-red-600 hover:text-red-500 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {filteredAndSortedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new project.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create your first project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

export default ProjectList;
