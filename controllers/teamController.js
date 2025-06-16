import TeamMember from '../models/TeamMember.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
export const getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({ isActive: true })
      .sort({ order: 1 });
    res.json(teamMembers);
  } catch (err) {
    console.error('Error fetching team members:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get single team member
// @route   GET /api/team/:id
// @access  Public
export const getTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.json(teamMember);
  } catch (err) {
    console.error('Error fetching team member:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create team member
// @route   POST /api/team
// @access  Private/Admin
export const createTeamMember = async (req, res) => {
  try {
    const {
      name,
      position,
      bio,
      socialLinks,
      order,
      email
    } = req.body;

    // Get image URL from Cloudinary upload
    const imageUrl = req.file ? req.file.path : null;

    if (!imageUrl) {
      return res.status(400).json({ msg: 'Image is required' });
    }

    const teamMember = new TeamMember({
      name,
      position,
      bio,
      imageUrl,
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
      order: order || 0,
      email: email || null
    });

    await teamMember.save();
    res.status(201).json(teamMember);
  } catch (err) {
    console.error('Error creating team member:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update team member
// @route   PUT /api/team/:id
// @access  Private/Admin
export const updateTeamMember = async (req, res) => {
  try {
    const {
      name,
      position,
      bio,
      socialLinks,
      order,
      isActive
    } = req.body;

    let teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    // If new image is uploaded, delete old image from Cloudinary
    if (req.file) {
      const oldImagePublicId = teamMember.imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(oldImagePublicId);
    }

    const updateData = {
      name,
      position,
      bio,
      socialLinks: socialLinks ? JSON.parse(socialLinks) : teamMember.socialLinks,
      order,
      isActive
    };

    // Add new image URL if uploaded
    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(teamMember);
  } catch (err) {
    console.error('Error updating team member:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Private/Admin
export const deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    // Delete image from Cloudinary
    const imagePublicId = teamMember.imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(imagePublicId);

    await teamMember.deleteOne();
    res.json({ msg: 'Team member removed' });
  } catch (err) {
    console.error('Error deleting team member:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
}; 