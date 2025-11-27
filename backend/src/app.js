import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sirv from 'sirv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

import authRoutes from './routes/authRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import boxRoutes from './routes/boxRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import prisma from './utils/prisma.js';

dotenv.config();

// Respect NODE_ENV; fallback to development when not set
const nodeEnv = process.env.NODE_ENV || 'development';


try {
  await prisma.$connect()
} catch (error) {
  console.error('Error during app setup:', error);
}



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const uploadsPath = path.resolve(__dirname, '..', 'public', 'uploads');

const app = express();
app.use((req,res,next)=>{
  console.log(req.method,req.url);
  next()
})

// Basic middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded assets (absolute path to avoid cwd issues)
app.use('/uploads', express.static(uploadsPath));

// API routes (add versioned prefix compatibility)
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/campaigns', campaignRoutes);
apiRouter.use('/boxes', boxRoutes);
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
// Mount user API on /api and /api/v1 for backward/forward compatibility
app.use(['/api', '/api/v1'], apiRouter);
// Extra fallback mounts to tolerate misconfigured base URLs (e.g., /auth/login without /api prefix)
app.use(['/auth', '/v1/auth'], authRoutes);

// Admin API keeps dedicated prefix
app.use('/admin/api', adminRoutes);


const serveClient = sirv(clientDistPath, {
  dev: nodeEnv !== 'production',
  maxAge: 31536000,
  immutable: true,
  single: true,
  gzip: true,
  brotli: true,
});

// In production, keep SPA fallback from hijacking API routes
if (nodeEnv === 'production') {
  app.use((req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/admin/api') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/v1/auth')
    ) {
      return next();
    }
    return serveClient(req, res, next);
  });
} else {
  app.use(serveClient);
}

export default app;
