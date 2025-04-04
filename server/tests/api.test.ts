import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js'; // Your Express app export
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Endpoints', () => {
  let userCookie: string[] = []; // We'll store the Set-Cookie array here
  let userId: number | null = null;

  // Store created user and task IDs for later cleanup
  let createdUserIds: number[] = [];
  let createdTaskIds: number[] = [];

  beforeAll(async () => {
    // Check if the test user exists and delete it
    const existingUser = await prisma.user.findUnique({
      where: { username: 'vitestuser' },
    });

    if (existingUser) {
      console.log('Deleting existing test user:', existingUser.id);
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
      console.log('Existing test user deleted');
    }
  });

  test('Register a new user', async () => {
    try {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'vitestuser',
          password: 'vitestpassword',
          role: 'ADMIN'
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      userId = res.body.id;

      // Only push to createdUserIds if userId is not null
      if (userId !== null) {
        createdUserIds.push(userId);
      }
    } catch (error) {
      console.error('Test failed during user registration');
      throw error; // Re-throw the error to fail the test
    }
  });

  test('Login user and receive cookie', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        username: 'vitestuser',
        password: 'vitestpassword',
      });
    expect(res.statusCode).toEqual(200);

    // Check for Set-Cookie header
    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(Array.isArray(setCookieHeader)).toBe(true);
    expect(setCookieHeader[0]).toContain('accessToken=');
    expect(setCookieHeader[0]).toContain('Path=/');
    expect(setCookieHeader[0]).toContain('HttpOnly');
    expect(setCookieHeader[0]).toContain('SameSite=Lax');

    if (Array.isArray(setCookieHeader)) {
      userCookie = setCookieHeader;
    } else {
      userCookie = [setCookieHeader];
    }
  });

  test('List users (requires authentication)', async () => {
    const res = await request(app)
      .get('/api/users/users')
      .set('Cookie', userCookie)
      .send();
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Update user profile', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Cookie', userCookie)
      .send({
        username: 'updatedvitestuser',
        password: 'newpassword',
        role: 'ADMIN',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.username).toEqual('updatedvitestuser');
    expect(res.body.role).toEqual('ADMIN');
  });

  // Cleanup function to delete users and tasks
  const cleanup = async () => {
    for (const uid of createdUserIds) {
      try {
        await prisma.user.delete({
          where: { id: uid },
        });
        console.log('User deleted:', uid);
      } catch (error) {
        console.error('Error deleting user:', uid, error);
      }
    }
    createdUserIds = [];

    for (const tid of createdTaskIds) {
      try {
        await prisma.task.delete({
          where: { id: tid },
        });
        console.log('Task deleted:', tid);
      } catch (error) {
        console.error('Error deleting task:', tid, error);
      }
    }
    createdTaskIds = [];
  };

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
});

describe('Task Endpoints', () => {
  let taskCookie: string[] = [];
  let taskId: number | null = null;
  let taskUserId: number | null = null;
  let createdTaskIds: number[] = [];

  beforeAll(async () => {
    // Check if the test user exists
    let existingTaskUser = await prisma.user.findUnique({
      where: { username: 'taskvitestuser' },
    });

    if (!existingTaskUser) {
      // Create a test user for task tests if one doesn't exist
      const registerRes = await request(app)
        .post('/api/users/register')
        .send({ username: 'taskvitestuser', password: 'taskvitestpassword', role: 'ADMIN' });
      existingTaskUser = registerRes.body;
    }

    // Check for null before accessing 'existingTaskUser.id'
    if (!existingTaskUser) {
      throw new Error('Failed to create or retrieve test user');
    }
    taskUserId = existingTaskUser.id;

    // Login user to retrieve session cookie
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ username: 'taskvitestuser', password: 'taskvitestpassword' });
    expect(loginRes.statusCode).toEqual(200);

    const setCookieHeader = loginRes.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();

    if (Array.isArray(setCookieHeader)) {
      taskCookie = setCookieHeader;
    } else {
      taskCookie = [setCookieHeader];
    }
  });

  test('Create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', taskCookie)
      .send({
        title: 'Vitest Task',
        description: 'Task for vitest tests',
        status: 'pending',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual('Vitest Task');
    taskId = res.body.id;

    // Only push if not null
    if (taskId !== null) {
      createdTaskIds.push(taskId);
    }
  });

  test('Get my tasks', async () => {
    const res = await request(app)
      .get('/api/tasks/my-tasks')
      .set('Cookie', taskCookie);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0].userId).toBeDefined();
    }
  });

  test('Update the task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Cookie', taskCookie)
      .send({
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'completed',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.title).toEqual('Updated Task Title');
    expect(res.body.status).toEqual('completed');
  });

  test('Delete the task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Cookie', taskCookie);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Task deleted successfully');
  });

  afterAll(async () => {
    // Delete the test user
    if (taskUserId) {
      try {
        await prisma.user.delete({
          where: { id: taskUserId },
        });
        console.log('Test user deleted:', taskUserId);
      } catch (error) {
        console.error('Error deleting test user:', taskUserId, error);
      }
    }
    await prisma.$disconnect();
  });
});
