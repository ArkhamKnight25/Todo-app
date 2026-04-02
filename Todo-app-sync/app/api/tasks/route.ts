import { Priority, TaskStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser, AuthError } from '@/lib/auth/session'
import {
  ensureDefaultProjectForWorkspace,
  ensureProjectHasSection,
  ensureWorkspaceForUser,
} from '@/lib/data/defaults'

const taskInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
      avatar: true,
      email: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
    },
  },
  section: {
    select: {
      id: true,
      name: true,
    },
  },
  subtasks: {
    select: {
      id: true,
      title: true,
      completed: true,
    },
    orderBy: {
      order: 'asc' as const,
    },
  },
  tags: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  _count: {
    select: {
      comments: true,
      subtasks: true,
      attachments: true,
    },
  },
}

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().optional(),
  sectionId: z.string().optional().nullable(),
  ownerId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const projectId = request.nextUrl.searchParams.get('projectId')

    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        project: {
          workspace: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      },
      include: taskInclude,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Fetch tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const parsed = createTaskSchema.parse(body)

    const workspace = await ensureWorkspaceForUser(user.id, user.name)

    let projectId = parsed.projectId
    if (!projectId) {
      const defaultProject = await ensureDefaultProjectForWorkspace(workspace.id)
      projectId = defaultProject.id
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let sectionId = parsed.sectionId ?? null
    if (sectionId) {
      const section = await prisma.section.findFirst({
        where: {
          id: sectionId,
          projectId: project.id,
        },
        select: {
          id: true,
        },
      })

      if (!section) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 })
      }
    } else {
      sectionId = (await ensureProjectHasSection(project.id)).id
    }

    const lastTask = await prisma.task.findFirst({
      where: { projectId: project.id },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    })

    const task = await prisma.task.create({
      data: {
        title: parsed.title,
        description: parsed.description || null,
        priority: parsed.priority ?? Priority.MEDIUM,
        status: parsed.status ?? TaskStatus.TODO,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        projectId: project.id,
        sectionId,
        ownerId: user.id,
        assigneeId: parsed.assigneeId || null,
        order: (lastTask?.order ?? -1) + 1,
      },
      include: taskInclude,
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid task data' }, { status: 400 })
    }

    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
