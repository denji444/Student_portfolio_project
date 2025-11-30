import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

const server = app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://${host}:${port} (PORT env=${process.env.PORT || 'undefined'})`);
});

// Set server timeout (70 seconds to be higher than request timeout)
server.timeout = 70000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});



