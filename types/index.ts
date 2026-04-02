export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface TaskCount {
  comments: number
  subtasks: number
  attachments: number
}

export interface TaskUser {
  id: string
  name: string | null
  avatar?: string | null
  email?: string | null
}

export interface ProjectSummary {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  _count?: {
    tasks: number
    sections: number
  }
}

export interface SectionSummary {
  id: string
  name: string
  order: number
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  order: number
  projectId: string
  sectionId: string | null
  ownerId: string
  assigneeId: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  owner: TaskUser
  assignee: TaskUser | null
  project: ProjectSummary
  section?: SectionSummary | null
  subtasks: Array<{
    id: string
    title: string
    completed: boolean
  }>
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  _count: TaskCount
}

export interface Section {
  id: string
  name: string
  order: number
  createdAt: string
  projectId: string
  tasks: Task[]
}

export interface Project extends ProjectSummary {}
