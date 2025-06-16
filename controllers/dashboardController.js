// @ts-nocheck
import mongoose from 'mongoose';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Subscription from '../models/Subscription.js';
import Testimonial from '../models/Testimonial.js';
import TeamMember from '../models/TeamMember.js';

// Helper function to safely get count from a model
const getSafeCount = async (model, query = {}) => {
  try {
    if (!model || !mongoose.model(model.modelName)) {
      console.warn(`Model ${model?.modelName} not found`);
      return 0;
    }
    return await model.countDocuments(query);
  } catch (error) {
    console.error(`Error counting documents for ${model?.modelName}:`, error);
    return 0;
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Check if models are available
    const models = { User, Portfolio, Subscription, Testimonial, TeamMember };
    const modelsAvailable = Object.entries(models).every(([name, model]) => {
      const isAvailable = model && mongoose.model(model.modelName);
      if (!isAvailable) {
        console.error(`Model ${name} is not available`);
      }
      return isAvailable;
    });

    if (!modelsAvailable) {
      return res.status(500).json({
        success: false,
        message: 'Some database models are not available',
        error: 'Database models not properly initialized'
      });
    }

    // Get counts for each model
    const [
      usersCount,
      portfolioItemsCount,
      activeSubscriptionsCount,
      testimonialsCount,
      teamMembersCount
    ] = await Promise.all([
      getSafeCount(User),
      getSafeCount(Portfolio),
      getSafeCount(Subscription, { status: 'active' }),
      getSafeCount(Testimonial),
      getSafeCount(TeamMember)
    ]);

    // Get recent activities
    let recentActivities = [];
    try {
      recentActivities = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt');
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }

    // Get revenue data (last 6 months)
    const revenueData = [];
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      months.push(month);
      
      // This is a placeholder - replace with actual revenue calculation
      // For example: const revenue = await Subscription.getRevenueForMonth(date);
      const revenue = Math.floor(Math.random() * 5000) + 1000; // Random data for demo
      revenueData.push({ month, revenue });
    }

    // Get project categories distribution
    const categories = await Portfolio.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count" } },
      { $sort: { value: -1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: usersCount,
        portfolioItems: portfolioItemsCount,
        activeSubscriptions: activeSubscriptionsCount,
        testimonials: testimonialsCount,
        teamMembers: teamMembersCount
      },
      recentActivities,
      charts: {
        revenue: revenueData,
        projectCategories: categories.length > 0 ? categories : [
          { name: 'Web Development', value: 40 },
          { name: 'Mobile Apps', value: 30 },
          { name: 'UI/UX Design', value: 20 },
          { name: 'Consulting', value: 10 }
        ]
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
};
