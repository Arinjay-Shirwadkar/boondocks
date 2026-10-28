import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import requestRoutes from './routes/requestRoutes.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables from server/.env or root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and run startup cleanup check for orphaned properties & requests
connectDB().then(async () => {
  try {
    const User = (await import('./models/User.js')).default;
    const Property = (await import('./models/Property.js')).default;
    const Request = (await import('./models/Request.js')).default;
    const users = await User.find().select('_id');
    const userIds = users.map((u) => u._id);
    const orphanProps = await Property.deleteMany({ hostId: { $nin: userIds } });
    const orphanReqs = await Request.deleteMany({
      $or: [{ hostId: { $nin: userIds } }, { seekerId: { $nin: userIds } }],
    });
    if (orphanProps.deletedCount > 0 || orphanReqs.deletedCount > 0) {
      console.log(`[Startup Cleanup] Purged ${orphanProps.deletedCount} orphaned properties and ${orphanReqs.deletedCount} orphaned requests.`);
    }
  } catch (err) {
    // Non-blocking cleanup logging
  }
}).catch(() => {});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for local property images
app.use('/uploads', express.static(uploadsDir));

// Request logger for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Boondocks API is operational',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/requests', requestRoutes);

// 404 handler for undefined API routes
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ message: `API route ${req.originalUrl} not found.` });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`🚀 Boondocks Backend Server running on http://localhost:${PORT}`);
});

export default app;
