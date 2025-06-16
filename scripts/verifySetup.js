import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

async function verifySetup() {
  console.log('🔍 Verifying backend setup...\n');

  // 1. Check environment variables
  console.log('Checking environment variables...');
  const requiredEnvVars = [
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'JWT_SECRET'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing environment variables:', missingEnvVars.join(', '));
    return;
  }
  console.log('✅ Environment variables loaded successfully\n');

  // 2. Test MongoDB connection
  console.log('Testing MongoDB connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return;
  }

  // 3. Test Cloudinary configuration
  console.log('Testing Cloudinary configuration...');
  try {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configured successfully\n');
  } catch (error) {
    console.error('❌ Cloudinary configuration failed:', error.message);
    return;
  }

  // 4. Test JWT
  console.log('Testing JWT configuration...');
  try {
    const testToken = jwt.sign({ test: 'data' }, process.env.JWT_SECRET);
    jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('✅ JWT configuration working correctly\n');
  } catch (error) {
    console.error('❌ JWT configuration failed:', error.message);
    return;
  }

  console.log('🎉 All backend components verified successfully!');
  process.exit(0);
}

verifySetup().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
}); 