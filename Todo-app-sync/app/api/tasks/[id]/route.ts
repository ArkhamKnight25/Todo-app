import { Priority, TaskStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser, AuthError } from '@/lib/auth/session'

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

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  order: z.number().int().min(0).optional(),
})

async function getTaskForUser(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    select: {
      id: true,
      projectId: true,
    },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)
    const task = await getTaskForUser(params.id, user.id)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateTaskSchema.parse(body)

    if (parsed.sectionId) {
      const section = await prisma.section.findFirst({
        where: {
          id: parsed.sectionId,
          projectId: task.projectId,
        },
      })

      if (!section) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 })
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description || null } : {}),
        ...(parsed.priority !== undefined ? { priority: parsed.priority } : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        ...(parsed.dueDate !== undefined ? { dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null } : {}),
        ...(parsed.sectionId !== undefined ? { sectionId: parsed.sectionId || null } : {}),
        ...(parsed.assigneeId !== undefined ? { assigneeId: parsed.assigneeId || null } : {}),
        ...(parsed.completedAt !== undefined ? { completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null } : {}),
        ...(parsed.order !== undefined ? { order: parsed.order } : {}),
      },
      include: taskInclude,
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid task update' }, { status: 400 })
    }

    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)
    const task = await getTaskForUser(params.id, user.id)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: task.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
