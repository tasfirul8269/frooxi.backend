import Portfolio from '../models/Portfolio.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all portfolio items
// @route   GET /api/portfolio
// @access  Public
export const getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json(portfolios);
  } catch (err) {
    console.error('Error fetching portfolios:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get single portfolio item
// @route   GET /api/portfolio/:id
// @access  Public
export const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ msg: 'Portfolio not found' });
    }
    res.json(portfolio);
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Portfolio not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create portfolio item
// @route   POST /api/portfolio
// @access  Private/Admin
export const createPortfolio = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      technologies = [],
      year,
      link,
      tags = [],
      featured = false,
      isActive = true
    } = req.body;

    // Check for required fields
    if (!title || !description || !category || !year) {
      return res.status(400).json({ 
        msg: 'Title, description, category, and year are required' 
      });
    }

    let imageUrl = '';
    
    // Handle file upload if exists
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'portfolio',
          resource_type: 'auto'
        });
        imageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error('Error uploading to Cloudinary:', uploadErr);
        return res.status(500).json({ msg: 'Error uploading image' });
      }
    } else if (req.body.image) {
      // If image is a URL (for existing images)
      imageUrl = req.body.image;
    } else {
      return res.status(400).json({ msg: 'Image is required' });
    }

    // Ensure arrays
    const technologiesArray = Array.isArray(technologies) 
      ? technologies 
      : technologies.split(',').map(t => t.trim()).filter(Boolean);
      
    const tagsArray = Array.isArray(tags)
      ? tags
      : tags.split(',').map(t => t.trim()).filter(Boolean);

    // Create new portfolio item
    const portfolio = new Portfolio({
      title,
      description,
      image: imageUrl, // Using 'image' field to match the model
      category,
      year,
      link: link || '',
      technologies: technologiesArray,
      tags: tagsArray,
      featured: Boolean(featured),
      isActive: Boolean(isActive)
    });

    await portfolio.save();
    
    // Return the created portfolio with populated fields
    const savedPortfolio = await Portfolio.findById(portfolio._id);
    res.status(201).json(savedPortfolio);
    
  } catch (err) {
    console.error('Error creating portfolio:', err);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Update portfolio item
// @route   PUT /api/portfolio/:id
// @access  Private/Admin
export const updatePortfolio = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      technologies,
      year,
      link,
      tags,
      isActive,
      featured
    } = req.body;

    let portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ msg: 'Portfolio not found' });
    }

    // If new image is uploaded, delete old image from Cloudinary
    if (req.file) {
      // Delete old image if it exists
      if (portfolio.image) {
        const publicId = portfolio.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      portfolio.image = req.file.path;
    }

    // Ensure technologies and tags are arrays
    const technologiesArray = Array.isArray(technologies) ? technologies : [technologies].filter(Boolean);
    const tagsArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);

    // Update fields
    if (title !== undefined) portfolio.title = title;
    if (description !== undefined) portfolio.description = description;
    if (category !== undefined) portfolio.category = category;
    if (technologies !== undefined) portfolio.technologies = technologiesArray;
    if (year !== undefined) portfolio.year = year;
    if (link !== undefined) portfolio.link = link;
    if (tags !== undefined) portfolio.tags = tagsArray;
    if (isActive !== undefined) portfolio.isActive = Boolean(isActive);
    if (featured !== undefined) portfolio.featured = Boolean(featured);

    portfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(portfolio);
  } catch (err) {
    console.error('Error updating portfolio:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Portfolio not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Toggle featured status of a portfolio item
// @route   PATCH /api/portfolio/:id/featured
// @access  Private/Admin
export const toggleFeatured = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    portfolio.featured = !portfolio.featured;
    await portfolio.save();

    res.json({ 
      success: true, 
      message: `Portfolio ${portfolio.featured ? 'marked as featured' : 'removed from featured'}`,
      featured: portfolio.featured
    });
  } catch (err) {
    console.error('Error toggling featured status:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete portfolio item
// @route   DELETE /api/portfolio/:id
// @access  Private/Admin
export const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ msg: 'Portfolio not found' });
    }

    // Delete image from Cloudinary if it exists
    if (portfolio.image) {
      try {
        const publicId = portfolio.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
        // Continue with deletion even if image deletion fails
      }
    }

    await Portfolio.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Portfolio removed' });
  } catch (err) {
    console.error('Error deleting portfolio:', err);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};