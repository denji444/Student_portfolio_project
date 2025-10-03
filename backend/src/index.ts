import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import './util/mailer.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import projectRoutes from './routes/projects.js';
import profileRoutes from './routes/profile.js';

const app = express();

// We are behind a proxy on Render; enable trust proxy so client IP is derived from X-Forwarded-For
// This is required for express-rate-limit v7+ to avoid ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// Security headers
    const isProd = process.env.NODE_ENV === 'production';
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // In development, disable CSP to avoid blocking local tools and OAuth flows
  contentSecurityPolicy: isProd
    ? {
        useDefaults: true,
        directives: {
          // Keep restrictive defaults, but explicitly allow required connections
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          connectSrc: [
            "'self'",
            // Supabase APIs
            'https://*.supabase.co',
            // Google OAuth endpoints
            'https://accounts.google.com',
            'https://apis.google.com',
          ],
          scriptSrc: [
            "'self'",
            // For Google OAuth SDK scripts
            'https://apis.google.com',
          ],
          imgSrc: ["'self'", 'data:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          frameSrc: [
            "'self'",
            'https://accounts.google.com',
          ],
        },
      }
    : false,
}));

// Prevent HTTP parameter pollution
app.use(hpp());

// Strict CORS with optional whitelist (comma-separated in CORS_ORIGINS)
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = allowedOrigins.length > 0
  ? {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('CORS not allowed'));
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      optionsSuccessStatus: 204,
    }
  : {
      // Mirror requesting origin when no whitelist provided (useful during initial deploy/debug)
      origin: true,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      optionsSuccessStatus: 204,
    };

app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

app.use(cors(corsOptions));
// Express 5 + path-to-regexp v6 does not accept bare '*' paths. Handle OPTIONS generically.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// JSON body parsing with size limits
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Global basic rate limit
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 800 });
app.use(globalLimiter);

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


