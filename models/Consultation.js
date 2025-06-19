import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  whatsapp: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  projectDetails: {
    type: String,
    required: [true, 'Project details are required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'in_progress', 'converted', 'rejected'],
    default: 'new'
  },
  source: {
    type: String,
    default: 'website'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search
consultationSchema.index({
  name: 'text',
  email: 'text',
  message: 'text',
  'notes.content': 'text'
});

const Consultation = mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);

export default Consultation;
