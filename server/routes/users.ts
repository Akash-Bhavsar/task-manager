import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateToken } from '../middlewares/authenticateToken';
import logger from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();


// REGISTER endpoint: Create a new user
router.post('/register', async (req: Request, res: Response) => {
  const { username, password, role } = req.body as { username: string; password: string; role: string; }; // replace with Prisam Role
  try {
    logger.info(`Attempting to register user with username="${username}"`);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role: role as Role },
      select: { id: true, username: true },
    });

    logger.info(`Successfully registered user with id=${user.id}, username="${user.username}"`);
    res.status(201).json(user);
  } catch (err) {
    logger.error(`Registration failed for username="${username}": ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET endpoint: List all users (requires authentication)
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Now 'req.userId' is typed as number | undefined, but guaranteed non-undefined once token is validated
    logger.info(`GET /users called by userId=${req.userId}`);

    const users = await prisma.user.findMany({
      select: { id: true, username: true },
    });

    logger.info(`Fetched ${users.length} users successfully`);
    res.json(users);
  } catch (err) {
    logger.error(`Failed to list users: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// PUT endpoint: Update a user
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id);
  const { username, password, role } = req.body as { username: string; password?: string; role?: Role };
  // Check if the user ID from token matches the user ID from params
  if (req.userId !== userId) {
    logger.warn(`User with id=${req.userId} tried to update user with id=${userId}, not authorized`);
    res.status(403).json({ error: 'Unauthorized: You can only update your own profile.' });
    return;
  }

  try {
    logger.info(`PUT /users/${userId} data={username:${username}, role:${role}} by userId=${req.userId}`);

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        password: hashedPassword ?? undefined,
        role: role,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    logger.info(`User with id=${userId} updated successfully`);
    res.json(updatedUser);
  } catch (err) {
    logger.error(`Failed to update user id=${userId}: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to update user' });
  }
});
// GET endpoint: Get a specific user's information
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info(`GET /users/me called by userId=${req.userId}`);

    // If no userId is present in the request after authentication, return false
    if (!req.userId) {
      logger.warn('No authenticated user found');
      res.json(false);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        role: true,
        // Exclude password and other sensitive fields
      },
    });

    if (!user) {
      logger.warn(`User with id=${req.userId} not found even though token was valid`);
      res.json(false);
      return;
    }

    logger.info(`Current user information fetched successfully for id=${req.userId}`);
    res.json(user);
  } catch (err) {
    logger.error(`Failed to get current user info: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// LOGIN endpoint: Authenticate user and return a JWT token
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string };
  try {
    logger.info(`POST /users/login attempt by username="${username}"`);

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      logger.warn(`Login failed for username="${username}" - user not found`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn(`Login failed for username="${username}" - incorrect password`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate a JWT token valid for 1 hour
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.env_type === 'production',
      sameSite: 'lax'
    });

    logger.info(`User id=${user.id}, username="${username}" logged in successfully`);
    res.json({ message: 'Login successful' });
  } catch (err) {
    logger.error(`Login failed for username="${username}": ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Login failed' });
  }
});

// DELETE endpoint: Delete a user (requires authentication)
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id);

  // Check if the user id from token matches the user id from params OR if the user is ADMIN
  const currentUser = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (req.userId !== userId && currentUser?.role !== 'ADMIN') {
    logger.warn(`User with id=${req.userId} tried to delete user id=${userId} without ADMIN role`);
    res.status(403).json({ error: 'Unauthorized: You can only delete your own profile.' });
    return;
  }

  try {
    logger.info(`DELETE /users/${userId} called by userId=${req.userId}, role=${currentUser?.role}`);
    await prisma.user.delete({ where: { id: userId } });
    logger.info(`User with id=${userId} deleted successfully`);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error(`Failed to delete user id=${userId}: ${(err as Error).message}`, { error: err });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/logout', (req: Request, res: Response): void => {
  logger.info(`POST /users/logout called`);
  res.clearCookie('accessToken');
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
