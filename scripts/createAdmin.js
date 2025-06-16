import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = 'mongodb+srv://frooxidb:TTFMUP24@frooxidb.rwb3ajp.mongodb.net/frooxiDB?retryWrites=true&w=majority&appName=FrooxiDB';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    const existing = await User.findOne({ email: 'adef05675@gmail.com' });
    if (existing) {
      console.log('Admin user already exists.');
      process.exit(0);
    }
    const passwordHash = await bcrypt.hash('12345678', 10);
    await User.create({
      name: 'Admin',
      username: 'admin',
      email: 'adef05675@gmail.com',
      password: passwordHash,
      isAdmin: true
    });
    console.log('Admin user created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

createAdmin(); 