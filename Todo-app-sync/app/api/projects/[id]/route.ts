import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser, AuthError } from '@/lib/auth/session'
import { ensureProjectHasSection } from '@/lib/data/defaults'

const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().optional().nullable(),
  color: z.string().min(4).max(30).optional(),
  icon: z.string().max(30).optional().nullable(),
})

async function getProjectForUser(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          tasks: true,
          sections: true,
        },
      },
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)
    const project = await getProjectForUser(params.id, user.id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await ensureProjectHasSection(project.id)
    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Fetch project error:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)
    const existingProject = await getProjectForUser(params.id, user.id)

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateProjectSchema.parse(body)

    const project = await prisma.project.update({
      where: { id: existingProject.id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description || null } : {}),
        ...(parsed.color !== undefined ? { color: parsed.color } : {}),
        ...(parsed.icon !== undefined ? { icon: parsed.icon || null } : {}),
      },
      include: {
        _count: {
          select: {
            tasks: true,
            sections: true,
          },
        },
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid project update' }, { status: 400 })
    }

    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)
    const project = await getProjectForUser(params.id, user.id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id: project.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
