import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireUser, AuthError } from '@/lib/auth/session'
import { ensureProjectHasSection } from '@/lib/data/defaults'

const createSectionSchema = z.object({
  name: z.string().min(1).max(80),
})

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
  _count: {
    select: {
      comments: true,
      subtasks: true,
      attachments: true,
    },
  },
}

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
    select: {
      id: true,
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

    const sections = await prisma.section.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        tasks: {
          include: taskInclude,
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Fetch sections error:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)
    const project = await getProjectForUser(params.id, user.id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createSectionSchema.parse(body)

    const lastSection = await prisma.section.findFirst({
      where: {
        projectId: project.id,
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    })

    const section = await prisma.section.create({
      data: {
        projectId: project.id,
        name: parsed.name,
        order: (lastSection?.order ?? -1) + 1,
      },
    })

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid section data' }, { status: 400 })
    }

    console.error('Create section error:', error)
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}
