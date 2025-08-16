'use client';

import React from 'react';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project & {
    workspaceName: string;
    _count: {
      tasks: number;
      sections: number;
    };
  };
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const getTaskStatusText = (count: number) => {
    if (count === 0) return 'No tasks';
    if (count === 1) return '1 task';
    return `${count} tasks`;
  };

  const getSectionText = (count: number) => {
    if (count === 0) return 'No sections';
    if (count === 1) return '1 section';
    return `${count} sections`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500">{project.workspaceName}</p>
          </div>
        </div>
        {project.icon && (
          <span className="text-2xl">{project.icon}</span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{getTaskStatusText(project._count.tasks)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{getSectionText(project._count.sections)}</span>
          </span>
        </div>
        <time className="text-xs">
          {new Date(project.updatedAt).toLocaleDateString()}
        </time>
      </div>

      {/* Progress indicator */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: project.color,
              width: `${Math.min((project._count.tasks / Math.max(project._count.tasks + 5, 10)) * 100, 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
