import Contact from '../models/Contact.js';
import { validationResult } from 'express-validator';

// @desc    Submit a contact form
// @route   POST /api/contact
// @access  Public
export const submitContactForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, subject, message } = req.body;
    
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await contact.save();
    
    // In a real app, you might want to send an email notification here
    
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully!',
      data: {
        name,
        email,
        subject,
        message
      }
    });
  } catch (err) {
    console.error('Error submitting contact form:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};

// @desc    Get all contact messages
// @route   GET /api/admin/contacts
// @access  Private/Admin
export const getContacts = async (req, res) => {
  console.log('getContacts called with query:', req.query);
  try {
    const { page = 1, limit = 10, search = '', read } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    console.log('Parsed pagination:', { pageNum, limitNum, skip });
    
    const query = {};
    
    // Search functionality
    if (search) {
      console.log('Adding search filter for:', search);
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by read status
    if (read === 'true' || read === 'false') {
      console.log('Adding read filter:', read === 'true');
      query.isRead = read === 'true';
    }
    
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    // Get total count for pagination
    const total = await Contact.countDocuments(query);
    console.log('Total documents found:', total);
    
    // Get paginated results
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .select('-__v')
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    console.log(`Fetched ${contacts.length} contacts`);
    
    const totalPages = Math.ceil(total / limitNum);
    
    const response = {
      success: true,
      data: {
        docs: contacts,
        total,
        limit: limitNum,
        page: pageNum,
        pages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
    
    console.log('Sending response with', response.data.docs.length, 'contacts');
    res.json(response);
    
  } catch (err) {
    console.error('Error in getContacts:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...(err.code && { code: err.code }),
      ...(err.keyPattern && { keyPattern: err.keyPattern }),
      ...(err.keyValue && { keyValue: err.keyValue })
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages',
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      } : undefined
    });
  }
};

// @desc    Get a single contact message
// @route   GET /api/admin/contacts/:id
// @access  Private/Admin
export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message
      }
    });
  } catch (err) {
    console.error('Error fetching contact:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact message'
    });
  }
};

// @desc    Delete a contact message
// @route   DELETE /api/admin/contacts/:id
// @access  Private/Admin
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact message'
    });
  }
};

// @desc    Toggle read status of a contact message
// @route   PATCH /api/admin/contacts/:id/read
// @access  Private/Admin
export const toggleReadStatus = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    contact.isRead = !contact.isRead;
    await contact.save();
    
    res.json({
      success: true,
      data: {
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message
      }
    });
  } catch (err) {
    console.error('Error toggling read status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update read status'
    });
  }
};
