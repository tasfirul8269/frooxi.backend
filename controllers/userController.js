import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  console.log('Register user request received:', { body: req.body });
  
  try {
    const { name, email, password, isAdmin } = req.body;
    
    console.log('Processing registration:', { 
      name, 
      email, 
      isAdmin,
      hasPassword: !!password 
    });
    
    // Validate required fields
    if (!name || !email || !password) {
      console.error('Missing required fields:', { 
        name: !!name, 
        email: !!email, 
        hasPassword: !!password 
      });
      return res.status(400).json({ 
        success: false,
        msg: 'Please include all required fields: name, email, password' 
      });
    }
    
    // Check if user exists
    console.log('Checking if user exists with email:', email);
    const userExists = await User.findOne({ email });
    console.log('User exists check result:', userExists ? 'User found' : 'User not found');
    
    if (userExists) {
      console.error('Registration failed: User already exists with email:', email);
      return res.status(400).json({ 
        success: false,
        msg: 'User already exists' 
      });
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    console.log('Creating user in database...');
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });
    
    console.log('User created successfully:', { userId: user._id, email: user.email });

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token
    });
    
  } catch (err) {
    console.error('Error in registerUser:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Handle duplicate key error (unique email)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: 'A user with this email already exists'
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        msg: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  console.log('Login request received:', { body: req.body });
  
  try {
    const { email, password } = req.body;
    
    console.log('Processing login for email:', email);
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error('Login failed: No user found with email:', email);
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid credentials' 
      });
    }
    
    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.error('Login failed: Incorrect password for email:', email);
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('Login successful for user:', { userId: user._id, email: user.email });
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token
    });
    
  } catch (err) {
    console.error('Error in loginUser:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: undefined
    });
    
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Server error' 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'User not found' 
      });
    }
    
    // Update user fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Only update password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    const updatedUser = await user.save();
    
    // Generate new token if email or password was changed
    let token;
    if (req.body.email || req.body.password) {
      token = jwt.sign(
        { id: updatedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
    }
    
    res.json({
      success: true,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: token || undefined
    });
    
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    
    // Handle duplicate key error (unique email)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error' 
    });
  }
};

// @desc    Update user by admin
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'User not found' 
      });
    }
    
    // Update user fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    
    // Only update password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    const updatedUser = await user.save();
    
    // Remove password from the response
    const { password, ...userWithoutPassword } = updatedUser._doc;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (err) {
    console.error('Error in updateUser:', err);
    
    // Handle duplicate key error (unique email)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        msg: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error' 
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Server error' 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'User not found' 
      });
    }
    
    // Prevent deleting your own account
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        success: false,
        msg: 'Cannot delete your own account' 
      });
    }
    
    await user.remove();
    
    res.json({ 
      success: true,
      msg: 'User removed' 
    });
    
  } catch (err) {
    console.error('Error in deleteUser:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid user ID' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error' 
    });
  }
};
