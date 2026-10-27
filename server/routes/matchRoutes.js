import express from 'express';
import Property from '../models/Property.js';
import { protect } from '../middleware/auth.js';
import { calculateMatchScore } from '../utils/matcher.js';

const router = express.Router();

// @route   GET /api/matches
// @desc    Calculate compatibility match percentage for all properties and return sorted by score
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;

    // Fetch all properties, populating host information
    const properties = await Property.find().populate('hostId', 'name email phone');

    // Calculate match score and breakdown for each property
    const matches = properties
      // Exclude properties where the logged in user is the host
      .filter((prop) => String(prop.hostId?._id || prop.hostId) !== String(user._id))
      .map((property) => {
        const { matchScore, distanceKm, breakdown } = calculateMatchScore(user, property);
        return {
          property,
          matchScore,
          distanceKm,
          breakdown,
        };
      });

    // Sort by highest compatibility percentage first
    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json(matches);
  } catch (error) {
    console.error('Match engine error:', error);
    res.status(500).json({ message: error.message || 'Server error calculating matches.' });
  }
});

export default router;

