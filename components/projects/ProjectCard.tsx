import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-semibold text-white"
            style={{ backgroundColor: project.color }}
          >
            {project.icon?.slice(0, 2) || project.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{project.name}</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Open Board</p>
          </div>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {project._count?.tasks ?? 0} tasks
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
        {project.description || 'No description yet.'}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{project._count?.sections ?? 0} sections</span>
        <span>Drag tasks between statuses</span>
      </div>
    </div>
  )
}
