import express from 'express';
import "reflect-metadata";
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
// Import configurations and middleware
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { initializeSocket } from './config/socket.js';
// Import routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import candidateRoutes from './routes/candidates.js';
import voteRoutes from './routes/votes.js';
import realtimeRoutes from './routes/realtime.js';
import ictAdminRoutes from './routes/ict-admin.js';
import backupRoutes from './routes/backups.js';
// Import middleware
import { apiLimiter } from './middleware/rateLimit.js';
import { timingMiddleware, memoryMonitoringMiddleware, queryOptimizationMiddleware, cacheMiddleware } from './middleware/performance.js';
// Load environment variables
dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
// Connect to databases
connectDatabase();
connectRedis();
// Initialize Socket.io
initializeSocket(io);
// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
// Performance monitoring
app.use(timingMiddleware);
app.use(memoryMonitoringMiddleware);
// Rate limiting
app.use('/api/', apiLimiter);
// Query optimization
app.use(queryOptimizationMiddleware);
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Compression
app.use(compression());
// Caching for public endpoints
app.use('/api/posts', cacheMiddleware(300)); // 5 minutes
app.use('/api/candidates', cacheMiddleware(300)); // 5 minutes
app.use('/api/realtime/voting-status', cacheMiddleware(30)); // 30 seconds
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/ict-admin', ictAdminRoutes);
app.use('/api/backups', backupRoutes);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});
// Error handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 E-Voting server running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});
export default app;
