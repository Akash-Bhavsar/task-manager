import express, { Request, Response } from 'express';
import { authenticateToken } from '../middlewares/authenticateToken';
import logger from '../utils/logger';
import prisma from '../utils/prisma';

const router = express.Router();

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

// GET all tasks: If user is ADMIN, get all tasks; otherwise get only theirs
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // We also store the entire user payload in req.user
    // By default we have: req.user?.id, req.user?.username, req.user?.role
    const user = req.user!; // '!' because we know it's set if token is valid
    logger.info(`GET /tasks called by userId=${user.id}, role=${user.role}`);

    let tasks;
    if (user.role === 'ADMIN') {
      tasks = await prisma.task.findMany();
      logger.info(`ADMIN user fetched all tasks (count=${tasks.length})`);
    } else {
      tasks = await prisma.task.findMany({ where: { userId: user.id } });
      logger.info(`USER userId=${user.id} fetched ${tasks.length} tasks`);
    }
    res.json(tasks);
  } catch (err) {
    logger.error(`Failed to get tasks for /: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// POST /tasks - Create a new task
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { title, description, status } = req.body as {
    title: string;
    description?: string;
    status: string;
  };

  try {
    const user = req.user!;
    logger.info(`POST /tasks called by userId=${user.id} to create task: title="${title}"`);

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
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
  const { title, description, status } = req.body as {
    title: string;
    description?: string;
    status: string;
  };

  try {
    const user = req.user!;
    logger.info(`PUT /tasks/${id} by userId=${user.id} with data={title:${title}, status:${status}}`);

    // updateMany returns the count of updated records
    const result = await prisma.task.updateMany({
      where: { id: parseInt(id), userId: user.id },
      data: { title, description, status },
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

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });

    logger.info(`Task (id=${id}) deleted successfully by userId=${user.id}`);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    logger.error(`Failed to delete task id=${id}: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
