"use client"

import React, { useEffect, useState } from 'react'

export default function ProjectList() {
	const [projects, setProjects] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const token = localStorage.getItem('accessToken')
				const res = await fetch('/api/projects', {
					headers: { Authorization: token ? `Bearer ${token}` : '' }
				})
				if (!mounted) return
				if (!res.ok) return setProjects([])
				const data = await res.json()
				setProjects(data.projects || data || [])
			} catch (e) {
				setProjects([])
			} finally {
				if (mounted) setLoading(false)
			}
		})()
		return () => { mounted = false }
	}, [])

	if (loading) return <div className="py-6 text-center">Loading projects…</div>
	if (projects.length === 0) return <div className="py-6 text-center">No projects yet</div>

	return (
		<div className="space-y-3">
			{projects.map((p:any) => (
				<div key={p.id} className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
							<div className="text-xs text-gray-500 dark:text-gray-400">{p.description}</div>
						</div>
					</div>
				</div>
			))}
		</div>
	)
}

