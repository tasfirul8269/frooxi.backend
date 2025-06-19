import Consultation from '../models/Consultation.js';
import { validationResult } from 'express-validator';

// @desc    Create a new consultation
// @route   POST /api/consultations
// @access  Public
export const createConsultation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { name, email, location, whatsapp, website, projectDetails } = req.body;
    
    const consultation = new Consultation({
      name,
      email,
      location,
      whatsapp,
      website: website || '',
      projectDetails,
      source: 'website',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer || 'Direct'
      }
    });

    await consultation.save();

    // TODO: Send email notification to admin
    // await sendConsultationEmail(consultation);

    res.status(201).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all consultations (for admin)
// @route   GET /api/consultations
// @access  Private/Admin
export const getConsultations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const consultations = await Consultation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Consultation.countDocuments(query);

    res.json({
      success: true,
      data: consultations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error getting consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update consultation status
// @route   PUT /api/consultations/:id/status
// @access  Private/Admin
export const updateConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const consultation = await Consultation.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Error updating consultation status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add note to consultation
// @route   POST /api/consultations/:id/notes
// @access  Private/Admin
export const addConsultationNote = async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;

    const consultation = await Consultation.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            content,
            addedBy: req.user.id
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Error adding note to consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
