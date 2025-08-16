import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
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
          orderBy: { order: 'asc' },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: true,
        attachments: true,
      },
    })
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const data = updateTaskSchema.parse(body)
    
    // Verify user has access to this task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { assigneeId: userId },
        ],
      },
    })
    
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Handle completion status
    const updateData: any = { ...data }
    if (data.status === 'COMPLETED' && !data.completedAt) {
      updateData.completedAt = new Date()
    } else if (data.status !== 'COMPLETED') {
      updateData.completedAt = null
    }
    
    // Handle date conversion
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate)
    } else if (data.dueDate === null) {
      updateData.dueDate = null
    }
    
    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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
    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    // Verify user has access to this task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        ownerId: userId, // Only owner can delete
      },
    })
    
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or no permission' }, { status: 404 })
    }
    
    await prisma.task.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
