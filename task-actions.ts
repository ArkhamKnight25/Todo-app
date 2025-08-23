'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';


interface TaskUpdateData {
    title?: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED';
    dueDate?: string | null;
  }
  
  interface TaskCreateData {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED';
    dueDate?: string | null;
  }

export const updateTaskAction = async (id: string, data: TaskUpdateData) => {
  try {
    await prisma.task.update({
      where: { id: id },
      data: {
        ...data,
      },
    });
    revalidatePath('/tasks');
    return { message: 'Updated task successfully' };
  } catch (error) {
    console.error('Failed to update task:', error);
    return { message: 'Failed to update task' };
  }
};

export const createTaskAction = async (data: TaskCreateData) => {
    try {
      await prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
          projectId: (data as any).projectId,
          sectionId: (data as any).sectionId,
          ownerId: (data as any).ownerId,
        }
      });
      revalidatePath('/tasks');
      return { message: 'Created task successfully' };
    } catch (error) {
      console.error('Failed to create task:', error);
      return { message: 'Failed to create task' };
    }
  };