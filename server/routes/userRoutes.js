import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/user/profile (or /api/users/profile)
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching profile' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, area, location, radiusKm } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (area !== undefined) user.area = area;
    if (location) user.location = location;
    if (radiusKm !== undefined) user.radiusKm = radiusKm;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating profile' });
  }
});

// @route   PUT /api/user/preferences
// @desc    Update current user living preferences and weights
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { preferences, priorityWeights } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (preferences) {
      user.preferences = {
        ...user.preferences.toObject(),
        ...preferences,
      };
    }

    if (priorityWeights) {
      user.priorityWeights = {
        ...user.priorityWeights.toObject(),
        ...priorityWeights,
      };
    }

    await user.save();

    res.json({
      preferences: user.preferences,
      priorityWeights: user.priorityWeights,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating preferences' });
  }
});

export default router;

