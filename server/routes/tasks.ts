import express, { Request, Response } from 'express';
import { authenticateToken } from '../middlewares/authenticateToken';
import logger from '../utils/logger';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
  normalizePriority,
  normalizeStatus,
} from '../utils/taskConstants';

const router = express.Router();

// Map a `sort` query value to a Prisma orderBy clause.
function sortToOrderBy(sort: string): Prisma.TaskOrderByWithRelationInput[] {
  switch (sort) {
    case 'created':
      return [{ createdAt: 'desc' }];
    case 'due':
      return [{ dueDate: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }];
    case 'title':
      return [{ title: 'asc' }];
    case 'position':
      return [{ position: 'asc' }, { id: 'asc' }];
    case 'updated':
    default:
      return [{ updatedAt: 'desc' }];
  }
}

// Parse an incoming dueDate into a Date | null, or undefined if not supplied.
function parseDueDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
}

// GET tasks for the authenticated user
router.get('/my-tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Since we set req.userId in authenticateToken, we can rely on it here.
    const userId = req.userId!;
    logger.info(`GET /my-tasks called by userId=${userId}`);

    const tasks = await prisma.task.findMany({
      where: { userId },
    });

    logger.info(`Successfully fetched ${tasks.length} tasks for userId=${userId}`);
    res.json(tasks);
  } catch (err) {
    logger.error(`Failed to get tasks for /my-tasks: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// GET tasks with server-side filter/search/sort/pagination.
// ADMIN sees all tasks; USER sees only their own. Returns a paginated envelope:
//   { items, total, page, pageSize, totalPages }
// Query params: status, q (title search), sort, page, pageSize.
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN';

    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'updated';
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.pageSize ?? '10'), 10) || 10)
    );

    // Ignore an unrecognized status (treat as "all") rather than erroring.
    const normStatus =
      statusParam && statusParam !== 'all' ? normalizeStatus(statusParam) : null;

    const where: Prisma.TaskWhereInput = {
      ...(isAdmin ? {} : { userId: user.id }),
      ...(normStatus ? { status: normStatus } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: sortToOrderBy(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    logger.info(
      `GET /tasks by userId=${user.id} role=${user.role} ` +
        `status=${normStatus ?? 'all'} q="${q}" sort=${sort} page=${page} -> ${items.length}/${total}`
    );

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    logger.error(`Failed to get tasks for /: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// GET /tasks/:id - Fetch a single task. ADMIN can read any task; a USER can
// only read their own. Returns JSON 404 when missing/unauthorized so callers
// get a clean error instead of Express's default "Cannot GET" HTML.
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid task id' });
    return;
  }

  try {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN';

    const task = await prisma.task.findFirst({
      where: { id, ...(isAdmin ? {} : { userId: user.id }) },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (err) {
    logger.error(`Failed to get task id=${id}: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// POST /tasks - Create a new task
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { title, description, status, priority, dueDate } = req.body as {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
  };

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const normStatus = status === undefined ? DEFAULT_STATUS : normalizeStatus(status);
  if (normStatus === null) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  const normPriority = priority === undefined ? DEFAULT_PRIORITY : normalizePriority(priority);
  if (normPriority === null) {
    res.status(400).json({ error: 'Invalid priority' });
    return;
  }
  const due = parseDueDate(dueDate);

  try {
    const user = req.user!;
    logger.info(`POST /tasks called by userId=${user.id} to create task: title="${title}"`);

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: normStatus,
        priority: normPriority,
        dueDate: due ?? null,
        userId: user.id,
      },
    });

    logger.info(`Task (id=${task.id}) created successfully by userId=${user.id}`);
    res.status(201).json(task);
  } catch (err) {
    logger.error(`Failed to create task: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /tasks/:id - Update an existing task
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { title, description, status, priority, dueDate, position } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    position?: number;
  };

  // Build a partial update — only touch fields that were supplied.
  const data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: Date | null;
    position?: number;
  } = {};

  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (status !== undefined) {
    const s = normalizeStatus(status);
    if (s === null) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    data.status = s;
  }
  if (priority !== undefined) {
    const p = normalizePriority(priority);
    if (p === null) {
      res.status(400).json({ error: 'Invalid priority' });
      return;
    }
    data.priority = p;
  }
  if (dueDate !== undefined) {
    const due = parseDueDate(dueDate);
    if (due === undefined && dueDate !== undefined) {
      res.status(400).json({ error: 'Invalid dueDate' });
      return;
    }
    data.dueDate = due ?? null;
  }
  if (position !== undefined) data.position = position;

  try {
    const user = req.user!;
    logger.info(`PUT /tasks/${id} by userId=${user.id} with data={title:${title}, status:${status}}`);

    // updateMany returns the count of updated records
    const result = await prisma.task.updateMany({
      where: { id: parseInt(id), userId: user.id },
      data,
    });

    if (result.count === 0) {
      logger.warn(`User userId=${user.id} attempted to update non-existent or unauthorized task id=${id}`);
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // We can fetch the updated task to return it
    const updatedTask = await prisma.task.findUnique({
      where: { id: parseInt(id) },
    });

    logger.info(`Task (id=${id}) updated successfully by userId=${user.id}`);
    res.json(updatedTask);
  } catch (err) {
    logger.error(`Failed to update task id=${id}: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id - Delete a task
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);

  try {
    const user = req.user!;
    logger.info(`DELETE /tasks/${id} called by userId=${user.id}`);

    if (user.role !== 'ADMIN') {
      logger.warn(`User userId=${user.id} attempted to delete task id=${id} without ADMIN privileges`);
      res.status(403).json({ error: 'Unauthorized: Only ADMIN users can delete tasks.' });
      return
    }

    // deleteMany never throws when the row is missing (unlike delete), so a
    // double-delete returns a clean 404 instead of a Prisma P2025 → 500.
    const result = await prisma.task.deleteMany({
      where: { id: parseInt(id) },
    });

    if (result.count === 0) {
      logger.warn(`User userId=${user.id} attempted to delete non-existent task id=${id}`);
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    logger.info(`Task (id=${id}) deleted successfully by userId=${user.id}`);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    logger.error(`Failed to delete task id=${id}: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
