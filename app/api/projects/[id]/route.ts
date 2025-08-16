import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

// GET /api/projects/[id] - Get specific project
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

    // Get project with access verification
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
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: {
                tasks: true
              }
            }
          }
        },
        tasks: {
          where: { sectionId: null }, // Tasks not assigned to any section
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
            tasks: true,
            sections: true
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

    // Get user's role in the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspace.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        memberRole: workspaceMember?.role || 'VIEWER'
      }
    });

  } catch (error) {
    console.error('Project GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
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

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId,
              role: {
                in: ['ADMIN', 'MEMBER'] // Only admins and members can edit
              }
            }
          }
        }
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
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

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.color && { color: body.color }),
        ...(body.icon !== undefined && { icon: body.icon })
      },
      include: {
        workspace: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            tasks: true,
            sections: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: {
        ...updatedProject,
        workspaceName: updatedProject.workspace.name
      }
    });

  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
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

    // Verify project exists and user has admin access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId,
              role: 'ADMIN' // Only admins can delete projects
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

    // Check if project has tasks
    const taskCount = await prisma.task.count({
      where: { projectId }
    });

    if (taskCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete project with existing tasks',
          details: `This project contains ${taskCount} task(s). Please move or delete all tasks before deleting the project.`
        },
        { status: 409 }
      );
    }

    // Delete project (this will cascade delete sections)
    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
