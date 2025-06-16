import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = 'mongodb+srv://frooxidb:TTFMUP24@frooxidb.rwb3ajp.mongodb.net/frooxiDB?retryWrites=true&w=majority&appName=FrooxiDB';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const email = 'adef05675@gmail.com';
    const password = '12345678';
    
    console.log('Checking for existing admin user...');
    const existing = await User.findOne({ email });
    
    if (existing) {
      console.log('Admin user already exists. Verifying password...');
      // Verify the existing user's password
      const isMatch = await bcrypt.compare(password, existing.password);
      if (isMatch) {
        console.log('Admin user exists and password is correct.');
      } else {
        console.log('Admin user exists but password is incorrect. Updating password...');
        const newPasswordHash = await bcrypt.hash(password, 10);
        existing.password = newPasswordHash;
        await existing.save();
        console.log('Admin user password updated successfully!');
      }
      process.exit(0);
    }
    
    console.log('Creating new admin user...');
    const passwordHash = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      name: 'Admin',
      username: 'admin',
      email: email,
      password: passwordHash,
      isAdmin: true
    });
    
    console.log('Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Password:', password); // Only for debugging, remove in production
    
    // Verify the password was hashed correctly
    const isMatch = await bcrypt.compare(password, adminUser.password);
    console.log('Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
    
    process.exit(0);
  } catch (err) {
    console.error('Error in createAdmin:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    process.exit(1);
  }
}

createAdmin();