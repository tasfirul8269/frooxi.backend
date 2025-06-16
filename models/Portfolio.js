import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  image: {
    type: String,
    required: [true, 'Image URL is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design', 'Other'],
      message: 'Please select a valid category'
    }
  },
  technologies: [{
    type: String,
    trim: true
  }],
  year: {
    type: String,
    required: [true, 'Year is required'],
    match: [/^\d{4}$/, 'Please enter a valid year (e.g., 2023)']
  },
  link: {
    type: String,
    trim: true,
    match: [/^https?:\/\//, 'Please use a valid URL with HTTP or HTTPS']
  },
  tags: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
portfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Portfolio', portfolioSchema); 