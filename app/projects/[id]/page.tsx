'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ProjectBoard } from '@/components/projects';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProjectBoard projectId={projectId} />
    </div>
  );
}
