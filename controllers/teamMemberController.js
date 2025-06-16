import TeamMember from '../models/TeamMember.js';

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
      imageUrl,
      socialLinks,
      skills,
      order
    } = req.body;

    const teamMember = new TeamMember({
      name,
      position,
      bio,
      imageUrl,
      socialLinks,
      skills,
      order
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
      imageUrl,
      socialLinks,
      skills,
      order,
      isActive
    } = req.body;

    let teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      {
        name,
        position,
        bio,
        imageUrl,
        socialLinks,
        skills,
        order,
        isActive
      },
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