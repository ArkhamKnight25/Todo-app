import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    // Check for authorization header first, then fallback to cookies
    let token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      token = req.cookies.get('access_token')?.value
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId } = verifyAccessToken(token)
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId && { projectId }),
        OR: [
          { ownerId: userId },
          { assigneeId: userId },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, color: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subtasks: {
          select: { id: true, title: true, completed: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        tags: true,
        _count: {
          select: { comments: true, subtasks: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })
    
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check for authorization header first, then fallback to cookies
    let token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      token = req.cookies.get('access_token')?.value
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId } = verifyAccessToken(token)
    const body = await req.json()
    const data = createTaskSchema.parse(body)
    
    // Create a default workspace and project if none exists
    let workspaceId = null
    let projectId = data.projectId
    
    if (!projectId) {
      // Find or create a default workspace
      let workspace = await prisma.workspace.findFirst({
        where: {
          members: {
            some: { userId }
          }
        }
      })
      
      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: 'My Workspace',
            slug: `workspace-${userId}`,
            members: {
              create: {
                userId,
                role: 'ADMIN'
              }
            }
          }
        })
      }
      
      workspaceId = workspace.id
      
      // Find or create a default project
      let project = await prisma.project.findFirst({
        where: {
          workspaceId: workspace.id
        }
      })
      
      if (!project) {
        project = await prisma.project.create({
          data: {
            name: 'Personal Tasks',
            workspaceId: workspace.id,
            color: '#3B82F6',
            sections: {
              create: [
                { name: 'To Do', order: 0 },
                { name: 'In Progress', order: 1 },
                { name: 'Done', order: 2 },
              ],
            },
          },
        })
      }
      
      projectId = project.id
    }
    
    // Get the highest order number for the section/project
    const maxOrder = await prisma.task.aggregate({
      where: {
        projectId,
        sectionId: data.sectionId || null,
      },
      _max: { order: true },
    })
    
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId,
        sectionId: data.sectionId,
        ownerId: userId,
        assigneeId: data.assigneeId && data.assigneeId.trim() !== '' ? data.assigneeId : null,
        priority: data.priority || 'MEDIUM',
        order: (maxOrder._max.order || 0) + 1,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, color: true },
        },
        section: {
          select: { id: true, name: true },
        },
        subtasks: true,
        tags: true,
        _count: {
          select: { comments: true, subtasks: true },
        },
      },
    })
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
