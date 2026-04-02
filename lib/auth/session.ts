import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

export class AuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    throw new AuthError('Missing authorization token')
  }

  return header.slice('Bearer '.length).trim()
}

export async function requireUser(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    const payload = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      throw new AuthError('User not found')
    }

    return user
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }

    throw new AuthError('Invalid or expired token')
  }
}
