// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user?: User;
  workspace?: Workspace;
}

// Project types
export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  workspace?: Workspace;
  sections?: Section[];
  tasks?: Task[];
  _count?: {
    tasks: number;
    sections: number;
  };
}

// Section types
export interface Section {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: string;
  project?: Project;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

// Task types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  order: number;
  projectId: string;
  sectionId?: string;
  ownerId: string;
  assigneeId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  section?: Section;
  owner?: User;
  assignee?: User;
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
  tags?: Tag[];
  _count?: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

// Subtask types
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  task?: Task;
}

// Comment types
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  task?: Task;
  user?: User;
}

// Attachment types
export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
  task?: Task;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
  tasks?: Task[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse extends ApiResponse {
  user?: User;
  tokens?: AuthTokens;
}

// Form types
export interface TaskFormData {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  assigneeId?: string;
  projectId: string;
  sectionId?: string;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  workspaceId: string;
  createDefaultSections?: boolean;
}

export interface SectionFormData {
  name: string;
  order?: number;
}

// Store types
export interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: TaskFormData) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (project: ProjectFormData) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
