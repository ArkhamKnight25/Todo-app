import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

// GET /api/projects/[id]/sections - Get sections for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const projectId = params.id;

    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get sections with tasks
    const sections = await prisma.section.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            _count: {
              select: {
                subtasks: true,
                comments: true,
                attachments: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      sections
    });

  } catch (error) {
    console.error('Sections GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/sections - Create new section
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const projectId = params.id;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Section name is required' },
        { status: 400 }
      );
    }

    // Verify user has access to project and can create sections
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId,
              role: {
                in: ['ADMIN', 'MEMBER'] // Only admins and members can create sections
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Get the next order number
    const lastSection = await prisma.section.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' }
    });

    const nextOrder = (lastSection?.order || 0) + 1;

    // Create section
    const section = await prisma.section.create({
      data: {
        name: body.name,
        projectId,
        order: body.order || nextOrder
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Section created successfully',
      section
    }, { status: 201 });

  } catch (error) {
    console.error('Section creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
