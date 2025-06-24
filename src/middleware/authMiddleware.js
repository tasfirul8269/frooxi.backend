import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import crypto from 'crypto';

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true
});

// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  req.csrfToken = csrfToken;
  next();
};

// Verify CSRF token
const verifyCSRFToken = (req, res, next) => {
  const token = req.cookies['XSRF-TOKEN'] || req.headers['x-xsrf-token'];
  
  if (!token) {
    return res.status(403).json({ success: false, message: 'CSRF token is missing' });
  }
  
  // In a real app, you would verify the token against the one stored in the session
  // For simplicity, we're just checking if it exists
  next();
};

// @desc    Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header or cookies
  if (
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) ||
    req.cookies.token
  ) {
    try {
      // Get token from header or cookie
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies.token) {
        token = req.cookies.token;
      }

      if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
      }

      // Verify token with error handling for different JWT errors
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Session expired, please login again',
            code: 'TOKEN_EXPIRED'
          });
        } else if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        } else {
          if (process.env.NODE_ENV !== 'production') console.error('Authentication error:', error);
          throw error;
        }
      }

      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user changed password after the token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please log in again.',
          code: 'PASSWORD_CHANGED'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Authentication error:', error);
      res.status(401);
      throw new Error('Not authorized, authentication failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// @desc    Authorize admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Role-based access control
const roleBasedAccess = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
        code: 'UNAUTHORIZED_ROLE'
      });
    }

    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Prevent browser from caching authentication pages
  if (req.path.includes('login') || req.path.includes('register')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

export { 
  protect, 
  admin, 
  authLimiter, 
  generateCSRFToken, 
  verifyCSRFToken, 
  roleBasedAccess, 
  securityHeaders 
};
