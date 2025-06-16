import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const dropEmailIndex = async () => {
  try {
    await connectDB();
    
    // Get the TeamMember model
    const TeamMember = (await import('../models/TeamMember.js')).default;
    
    // Drop the email_1 index
    await TeamMember.collection.dropIndex('email_1');
    console.log('Dropped email_1 index');
    
    // Create a new non-unique index on email
    await TeamMember.collection.createIndex({ email: 1 }, { unique: false });
    console.log('Created new non-unique index on email field');
    
    console.log('Successfully updated email index');
    process.exit(0);
  } catch (err) {
    console.error('Error updating email index:', err);
    process.exit(1);
  }
};

dropEmailIndex();
