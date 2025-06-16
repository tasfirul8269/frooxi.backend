import Subscription from '../models/Subscription.js';

// @desc    Get all subscription plans
// @route   GET /api/subscriptions
// @access  Public
export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ isActive: true })
      .sort({ price: 1 });
    res.json(subscriptions);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get single subscription plan
// @route   GET /api/subscriptions/:id
// @access  Public
export const getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    res.json(subscription);
  } catch (err) {
    console.error('Error fetching subscription:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create subscription plan
// @route   POST /api/subscriptions
// @access  Private/Admin
export const createSubscription = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      features,
      isPopular
    } = req.body;

    const subscription = new Subscription({
      name,
      description,
      price,
      duration,
      features,
      isPopular
    });

    await subscription.save();
    res.status(201).json(subscription);
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update subscription plan
// @route   PUT /api/subscriptions/:id
// @access  Private/Admin
export const updateSubscription = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      features,
      isPopular,
      isActive
    } = req.body;

    let subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        duration,
        features,
        isPopular,
        isActive
      },
      { new: true }
    );

    res.json(subscription);
  } catch (err) {
    console.error('Error updating subscription:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete subscription plan
// @route   DELETE /api/subscriptions/:id
// @access  Private/Admin
export const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ msg: 'Subscription not found' });
    }

    await subscription.deleteOne();
    res.json({ msg: 'Subscription removed' });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subscription not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
}; 