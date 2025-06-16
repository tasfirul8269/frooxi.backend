import Testimonial from '../models/Testimonial.js';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1 });
    res.json(testimonials);
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
// @access  Public
export const getTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (err) {
    console.error('Error fetching testimonial:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Private/Admin
export const createTestimonial = async (req, res) => {
  try {
    const {
      clientName,
      clientPosition,
      clientCompany,
      content,
      rating,
      imageUrl,
      isActive = true,
      featured = false,
      order = 0
    } = req.body;

    const testimonial = new Testimonial({
      clientName,
      clientPosition,
      clientCompany,
      content,
      rating,
      imageUrl,
      isActive,
      featured,
      order
    });

    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (err) {
    console.error('Error creating testimonial:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private/Admin
export const updateTestimonial = async (req, res) => {
  try {
    const {
      clientName,
      clientPosition,
      clientCompany,
      content,
      rating,
      imageUrl,
      order,
      isActive
    } = req.body;

    let testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        clientName,
        clientPosition,
        clientCompany,
        content,
        rating,
        imageUrl,
        order,
        isActive
      },
      { new: true }
    );

    res.json(testimonial);
  } catch (err) {
    console.error('Error updating testimonial:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private/Admin
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    // Delete image from Cloudinary if it exists
    if (testimonial.imageUrl) {
      try {
        // Extract public ID from the URL (format: https://res.cloudinary.com/.../public_id.ext)
        const publicId = testimonial.imageUrl.split('/').pop().split('.')[0];
        if (publicId) {
          await cloudinary.v2.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Continue with testimonial deletion even if image deletion fails
      }
    }

    await Testimonial.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'Testimonial removed successfully' });
  } catch (err) {
    console.error('Error deleting testimonial:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Toggle testimonial status
// @route   PATCH /api/testimonials/:id/status
// @access  Private/Admin
export const toggleTestimonialStatus = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    
    testimonial.isActive = !testimonial.isActive;
    await testimonial.save();
    
    res.json({ 
      success: true,
      message: `Testimonial ${testimonial.isActive ? 'published' : 'unpublished'} successfully`,
      testimonial 
    });
    
  } catch (err) {
    console.error('Error toggling testimonial status:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Toggle testimonial featured status
// @route   PATCH /api/testimonials/:id/featured
// @access  Private/Admin
export const toggleTestimonialFeatured = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    
    testimonial.featured = !testimonial.featured;
    await testimonial.save();
    
    res.json({ 
      success: true,
      message: `Testimonial ${testimonial.featured ? 'featured' : 'unfeatured'} successfully`,
      testimonial 
    });
    
  } catch (err) {
    console.error('Error toggling testimonial featured status:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};