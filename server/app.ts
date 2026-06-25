import express, {Request, Response } from 'express';
import morgan from 'morgan';
import logger from './utils/logger';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();

// Behind Render/Cloudflare. Trust the proxy so secure cookies, req.ip and
// req.secure work correctly.
app.set('trust proxy', 1);

// CORS allowlist. CLIENT_ORIGIN is a comma-separated list of exact origins
// (e.g. "http://localhost:3000,https://task-manager-phi-eight-69.vercel.app").
// CLIENT_ORIGIN_REGEX optionally allows changing preview URLs, e.g.
// "^https://task-manager-[a-z0-9-]+\\.vercel\\.app$".
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const originRegex = process.env.CLIENT_ORIGIN_REGEX
  ? new RegExp(process.env.CLIENT_ORIGIN_REGEX)
  : null;

app.use(cors({
  origin(origin, callback) {
    // No Origin header = same-origin or non-browser client (curl, server-to-server).
    if (!origin || allowedOrigins.includes(origin) || originRegex?.test(origin)) {
      return callback(null, true);
    }
    // Deny without throwing: the browser blocks the response (no CORS headers)
    // and we avoid noisy 500s from an unhandled error.
    logger.warn(`Blocked CORS origin: ${origin}`);
    callback(null, false);
  },
  credentials: true
}));
const port = process.env.PORT || 3000;
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req: Request, res: Response) => {
  logger.info('Handling GET / request'); // Winston app-level log
  res.send('Welcome to the Task Manager API.');
});


export default app;
