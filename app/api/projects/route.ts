import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser, AuthError } from '@/lib/auth/session'
import {
  ensureDefaultProjectForWorkspace,
  ensureProjectHasSection,
  ensureWorkspaceForUser,
} from '@/lib/data/defaults'

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
  color: z.string().min(4).max(30).optional(),
  icon: z.string().max(30).optional().nullable(),
})

const projectInclude = {
  _count: {
    select: {
      tasks: true,
      sections: true,
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const workspace = await ensureWorkspaceForUser(user.id, user.name)
    await ensureDefaultProjectForWorkspace(workspace.id)

    const projects = await prisma.project.findMany({
      where: {
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      include: projectInclude,
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Fetch projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const parsed = createProjectSchema.parse(body)
    const workspace = await ensureWorkspaceForUser(user.id, user.name)

    const project = await prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: parsed.name,
        description: parsed.description || null,
        color: parsed.color || '#2563eb',
        icon: parsed.icon || null,
      },
      include: projectInclude,
    })

    await ensureProjectHasSection(project.id)

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid project data' }, { status: 400 })
    }

    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
