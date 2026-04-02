'use client';

import React from 'react';
import { ProjectList } from '@/components/projects';

export default function ProjectsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProjectList />
    </div>
  );
}
