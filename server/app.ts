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

// Allowed browser origin for CORS. Set CLIENT_ORIGIN in production to the
// deployed client URL (e.g. https://<project>.vercel.app).
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: clientOrigin,
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
