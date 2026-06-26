import express, { Request, Response } from 'express';
import { authenticateToken } from '../middlewares/authenticateToken';
import logger from '../utils/logger';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

const router = express.Router();

// #rrggbb (or #rgb). Labels store a hex color for their chip.
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// GET /api/labels - the authenticated user's labels (alphabetical).
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const labels = await prisma.label.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    res.json(labels);
  } catch (err) {
    logger.error(`Failed to list labels: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to get labels' });
  }
});

// POST /api/labels - create a label for the authenticated user.
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { name, color } = req.body as { name?: string; color?: string };

  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) {
    res.status(400).json({ error: 'Label name is required' });
    return;
  }
  if (color !== undefined && !HEX_COLOR.test(color)) {
    res.status(400).json({ error: 'Invalid color (expected hex like #64748b)' });
    return;
  }

  try {
    const userId = req.userId!;
    const label = await prisma.label.create({
      data: { name: trimmed, color: color ?? '#64748b', userId },
    });
    logger.info(`Label (id=${label.id}) created by userId=${userId}`);
    res.status(201).json(label);
  } catch (err) {
    // Unique [userId, name] violation → 409 instead of a generic 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'A label with that name already exists' });
      return;
    }
    logger.error(`Failed to create label: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// DELETE /api/labels/:id - delete the user's own label (also detaches it from
// every task via the implicit join table).
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid label id' });
    return;
  }

  try {
    const userId = req.userId!;
    // deleteMany scopes to the owner and is idempotent (no P2025 on a missing row).
    const result = await prisma.label.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      res.status(404).json({ error: 'Label not found' });
      return;
    }
    logger.info(`Label (id=${id}) deleted by userId=${userId}`);
    res.json({ message: 'Label deleted successfully' });
  } catch (err) {
    logger.error(`Failed to delete label id=${id}: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

export default router;
