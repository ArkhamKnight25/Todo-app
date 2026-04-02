import { prisma } from '@/lib/prisma'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueWorkspaceSlug(baseName: string) {
  const baseSlug = slugify(baseName) || 'workspace'
  let slug = baseSlug
  let attempt = 1

  while (await prisma.workspace.findUnique({ where: { slug } })) {
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  return slug
}

export async function ensureWorkspaceForUser(userId: string, userName?: string | null) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      joinedAt: 'asc',
    },
  })

  if (membership?.workspace) {
    return membership.workspace
  }

  const workspaceName = userName?.trim() ? `${userName}'s Workspace` : 'Personal Workspace'
  const slug = await uniqueWorkspaceSlug(workspaceName)

  return prisma.workspace.create({
    data: {
      name: workspaceName,
      slug,
      members: {
        create: {
          userId,
          role: 'ADMIN',
        },
      },
    },
  })
}

export async function ensureProjectHasSection(projectId: string) {
  const existingSection = await prisma.section.findFirst({
    where: { projectId },
    orderBy: {
      order: 'asc',
    },
  })

  if (existingSection) {
    return existingSection
  }

  return prisma.section.create({
    data: {
      projectId,
      name: 'Backlog',
      order: 0,
    },
  })
}

export async function ensureDefaultProjectForWorkspace(workspaceId: string) {
  const existingProject = await prisma.project.findFirst({
    where: { workspaceId },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (existingProject) {
    await ensureProjectHasSection(existingProject.id)
    return existingProject
  }

  const project = await prisma.project.create({
    data: {
      workspaceId,
      name: 'Inbox',
      description: 'Default project for quick capture',
      color: '#2563eb',
      icon: 'Inbox',
    },
  })

  await ensureProjectHasSection(project.id)
  return project
}
