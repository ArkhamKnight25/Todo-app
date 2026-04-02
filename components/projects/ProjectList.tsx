'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProjectCard from './ProjectCard'
import ProjectModal from './ProjectModal'
import type { Project } from '@/types'

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/projects', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load projects')
      }

      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      setProjects([])
      setError(error instanceof Error ? error.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  if (loading) {
    return <div className="py-6 text-center">Loading projects...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create boards, group work, and move tasks across statuses.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          New Project
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">No projects yet</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create your first project to unlock the board view and drag-and-drop flow.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProjectModal
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false)
            fetchProjects()
          }}
        />
      )}
    </div>
  )
}
