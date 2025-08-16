import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

// GET /api/projects - List all projects for user's workspace
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;

    // Get user's workspaces and their projects
    const workspaceMemberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            projects: {
              include: {
                _count: {
                  select: {
                    tasks: true,
                    sections: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    // Flatten projects from all workspaces
    const projects = workspaceMemberships.flatMap(membership => 
      membership.workspace.projects.map(project => ({
        ...project,
        workspaceName: membership.workspace.name,
        memberRole: membership.role
      }))
    );

    return NextResponse.json({
      success: true,
      projects,
      total: projects.length
    });

  } catch (error) {
    console.error('Projects GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.workspaceId) {
      return NextResponse.json(
        { error: 'Project name and workspace ID are required' },
        { status: 400 }
      );
    }

    // Verify user has access to the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: body.workspaceId
        }
      }
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      );
    }

    // Check if user has permission to create projects (ADMIN or MEMBER)
    if (workspaceMember.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'You do not have permission to create projects' },
        { status: 403 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        color: body.color || '#0066FF',
        icon: body.icon || null,
        workspaceId: body.workspaceId
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

    // Create default sections if requested
    if (body.createDefaultSections) {
      const defaultSections = [
        { name: 'To Do', order: 1 },
        { name: 'In Progress', order: 2 },
        { name: 'Review', order: 3 },
        { name: 'Done', order: 4 }
      ];

      await prisma.section.createMany({
        data: defaultSections.map(section => ({
          ...section,
          projectId: project.id
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project: {
        ...project,
        workspaceName: project.workspace.name
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Project creation error:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A project with this name already exists in the workspace' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
