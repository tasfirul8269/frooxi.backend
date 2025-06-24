import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Express } from 'express-serve-static-core';
import express from 'express';

// Define Content Security Policy
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      ...(process.env.NODE_ENV === 'development' ? [
        "'unsafe-inline'",
        "'unsafe-eval'"
      ] : []),
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ],
    styleSrc: [
      "'self'",
      ...(process.env.NODE_ENV === 'development' ? [
        "'unsafe-inline'"
      ] : []),
      'https://fonts.googleapis.com',
    ],
    fontSrc: [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://res.cloudinary.com',
      'https://www.google-analytics.com',
    ],
    connectSrc: [
      "'self'",
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'wss://*.sentry.io',
    ],
    frameSrc: [
      "'self'",
      'https://www.youtube.com',
      'https://www.google.com',
    ],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
  reportOnly: process.env.NODE_ENV === 'development',
};

// Security headers middleware
export const securityHeaders = [
  // Set Content Security Policy
  helmet.contentSecurityPolicy(cspConfig as any),
  
  // Prevent clickjacking
  helmet.frameguard({ action: 'deny' }),
  
  // Enable XSS protection
  helmet.xssFilter(),
  
  // Prevent MIME type sniffing
  helmet.noSniff(),
  
  // Hide X-Powered-By header
  helmet.hidePoweredBy(),
  
  // Set HSTS header
  helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  }),
  
  // Prevent DNS prefetching
  helmet.dnsPrefetchControl({ allow: false }),
  
  // Set X-Content-Type-Options
  helmet.ieNoOpen(),
  
  // Set X-Download-Options
  helmet.ieNoOpen(),
  
  // Set X-Frame-Options
  helmet.frameguard({ action: 'deny' }),
  
  // Set X-XSS-Protection
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },
  
  // Set Referrer-Policy
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  },
  
  // Set Feature-Policy
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Feature-Policy',
      [
        "accelerometer 'none'",
        "camera 'none'",
        "geolocation 'none'",
        "gyroscope 'none'",
        "magnetometer 'none'",
        "microphone 'none'",
        "payment 'none'",
        "usb 'none'",
      ].join('; ')
    );
    next();
  },
  
  // Set Permissions-Policy
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=()',
        'usb=()',
      ].join(', ')
    );
    next();
  },
];

// Export CSP report URI for reporting policy violations
export const cspReportUri = '/api/security/csp-report';

// Middleware to handle CSP violation reports
export const cspReportHandler = (req: Request, res: Response) => {
  if (req.body) {
    console.warn('CSP Violation:', JSON.stringify(req.body, null, 2));
  }
  res.status(204).end();
};

// Export all security middleware
export const securityMiddleware = (app: Express) => {
  // Apply all security headers
  app.use(securityHeaders);
  
  // Add CSP report endpoint
  app.use(express.json({ limit: '10kb' }));
  app.post(cspReportUri, cspReportHandler);
  
  // Trust first proxy
  app.set('trust proxy', 1);
  
  // Additional security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    next();
  });
};
