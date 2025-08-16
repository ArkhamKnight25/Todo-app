'use client';

import React, { useState } from 'react';
import { ProjectFormData } from '@/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

const colors = [
  '#0066FF', '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
  '#85C1E9', '#F8C471', '#82E0AA', '#F1948A', '#AED6F1'
];

const icons = ['📊', '🚀', '💡', '🎯', '📱', '🌟', '⚡', '🔥', '💰', '🎨', '🏆', '📈', '🛠️', '🎭', '🌍'];

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    color: colors[0],
    icon: '',
    workspaceId: '', // This should be set based on current workspace
    createDefaultSections: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock workspace for now - in real app, get from context/store
  React.useEffect(() => {
    if (isOpen) {
      // Create a default workspace if none exists (for demo purposes)
      setFormData(prev => ({ ...prev, workspaceId: 'default-workspace-id' }));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: colors[0],
      icon: '',
      workspaceId: '',
      createDefaultSections: true
    });
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create New Project</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter project description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-400' : 'border-gray-200'
                    } hover:border-gray-400 transition-colors`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Icon (Optional)
              </label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: '' }))}
                  className={`w-8 h-8 rounded border-2 flex items-center justify-center text-sm ${
                    !formData.icon ? 'border-gray-400 bg-gray-100' : 'border-gray-200 hover:border-gray-400'
                  } transition-colors`}
                >
                  ✕
                </button>
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center text-sm ${
                      formData.icon === icon ? 'border-gray-400 bg-gray-100' : 'border-gray-200 hover:border-gray-400'
                    } transition-colors`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Default Sections */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createDefaultSections"
                checked={formData.createDefaultSections}
                onChange={(e) => setFormData(prev => ({ ...prev, createDefaultSections: e.target.checked }))}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="createDefaultSections" className="ml-2 text-sm text-gray-700">
                Create default sections (To Do, In Progress, Review, Done)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={loading}
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{loading ? 'Creating...' : 'Create Project'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
