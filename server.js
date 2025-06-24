import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import helmet from 'helmet';
import { securityHeaders, cspReportUri, cspReportHandler } from './src/middleware/securityHeaders.js';
import cookieParser from 'cookie-parser';
import { generateCSRFToken, verifyCSRFToken } from './src/middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import winston from 'winston';
import apiKeyAuth from './middleware/apiKeyAuth.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// CORS configuration
const whitelist = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://frooxi.com',
  'https://www.frooxi.com',
  'https://frooxi-backend.onrender.com'
];

console.log = () => {};
console.error = () => {};
console.warn = () => {};
console.info = () => {};
console.debug = () => {};

console.log('CORS Whitelist:', whitelist);

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist or is from the same domain
    if (whitelist.indexOf(origin) !== -1 || whitelist.some(domain => origin.endsWith(domain))) {
      callback(null, true);
    } else {
      console.error('CORS Error: Origin not allowed -', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-auth-token'],
  exposedHeaders: ['Authorization', 'x-auth-token'],
  maxAge: 600
};

// Enable CORS
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

// Parse JSON and URL-encoded bodies with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable Helmet for basic security
app.use(helmet());
// Custom security headers
app.use(securityHeaders);

// Trust first proxy (for secure cookies, etc.)
app.set('trust proxy', 1);
// CSP violation report endpoint
app.use(express.json({ limit: '10kb' }));
app.post(cspReportUri, cspReportHandler);

// Parse cookies for CSRF protection
app.use(cookieParser());
// Generate CSRF token for all authenticated sessions
app.use(generateCSRFToken);
// Require CSRF token verification on all state-changing routes
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return verifyCSRFToken(req, res, next);
  }
  next();
});

// HTTP Parameter Pollution protection
app.use(hpp());
// Rate limiting for login and register endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
// Rate limiting for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many uploads from this IP, please try again later.'
});
app.use('/api/portfolio', uploadLimiter);
app.use('/api/team', uploadLimiter);
// Winston logger for audit logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'audit.log' })
  ]
});
// Audit log middleware for sensitive actions
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    logger.info({
      time: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      user: req.user ? req.user._id : null,
      ip: req.ip
    });
  }
  next();
});
// Placeholder for malware scanning middleware (to be implemented with ClamAV)
const malwareScan = (req, res, next) => {
  // TODO: Integrate ClamAV or similar here
  next();
};

// Apply API key auth to all API routes
app.use('/api', apiKeyAuth);

// Mount API routes
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/consultations', consultationRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
}); 