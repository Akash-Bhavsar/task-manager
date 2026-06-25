import { PrismaClient } from '@prisma/client';

// Single shared Prisma client for the whole app. Creating one client per route
// module opens a separate connection pool each, which exhausts the limited
// connections on hosted Postgres (e.g. Neon free tier).
const prisma = new PrismaClient();

export default prisma;
