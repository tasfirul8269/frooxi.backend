import multer from 'multer';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Configure storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter
});

// Middleware to validate file contents
const validateFileContent = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const fileBuffer = req.file.buffer;
    const fileType = await fileTypeFromBuffer(fileBuffer);
    
    // Check if the detected file type matches the declared type
    if (!fileType || !ALLOWED_FILE_TYPES.includes(fileType.mime)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file content. File type does not match its extension.' 
      });
    }
    
    // Add file type to request for further processing
    req.file.detectedMimeType = fileType.mime;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('File validation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing file' 
    });
  }
};

// Middleware to sanitize filename
const sanitizeFilename = (req, res, next) => {
  if (!req.file) return next();
  
  // Remove special characters and spaces from filename
  const originalName = req.file.originalname;
  const sanitized = originalName
    .replace(/[^\w\d.-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  
  // Add timestamp to prevent filename collisions
  const timestamp = Date.now();
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  
  req.file.originalname = `${name}_${timestamp}${ext}`;
  next();
};

export { 
  upload, 
  validateFileContent, 
  sanitizeFilename,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE 
};
