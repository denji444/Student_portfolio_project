import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import projectRoutes from './routes/projects.js';
import profileRoutes from './routes/profile.js';

const app = express();

app.use(cors({ origin: true, credentials: false, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Student Portfolio API' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

// Basic request logger to help diagnose 503s
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://${host}:${port} (PORT env=${process.env.PORT || 'undefined'})`);
});


