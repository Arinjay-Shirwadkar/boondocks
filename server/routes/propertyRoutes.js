import express from 'express';
import Property from '../models/Property.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/properties
// @desc    Create a new sharing PG or flat listing
// @access  Private (Host or Seeker/Both)
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      type = 'PG',
      location,
      rentPerHead,
      totalBeds,
      availableBeds,
      rules,
      amenities,
      images,
    } = req.body;

    if (!title || !location || !location.address) {
      return res.status(400).json({ message: 'Title and address are required.' });
    }

    const total = Number(totalBeds);
    const available = Number(availableBeds);

    if (isNaN(total) || total < 1) {
      return res.status(400).json({ message: 'Total beds must be at least 1.' });
    }

    if (isNaN(available) || available < 0) {
      return res.status(400).json({ message: 'Available beds cannot be negative.' });
    }

    if (available > total) {
      return res.status(400).json({ message: "Available beds cannot exceed total beds." });
    }

    const rent = Number(rentPerHead);
    if (isNaN(rent) || rent < 0) {
      return res.status(400).json({ message: 'Rent per head must be a non-negative number.' });
    }

    const property = await Property.create({
      hostId: req.user._id,
      title,
      type,
      location,
      rentPerHead: rent,
      totalBeds: total,
      availableBeds: available,
      rules: rules || {},
      amenities: amenities || undefined,
      images: images || [],
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: error.message || 'Server error creating property.' });
  }
});

// @route   GET /api/properties/mine
// @desc    Get all properties listed by logged-in host
// @access  Private
router.get('/mine', protect, async (req, res) => {
  try {
    const properties = await Property.find({ hostId: req.user._id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching host properties.' });
  }
});

// @route   GET /api/properties
// @desc    Get all active properties
// @access  Public (or Private)
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().populate('hostId', 'name email phone').sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching properties.' });
  }
});

// @route   GET /api/properties/:id
// @desc    Get single property details
// @access  Public (or Private)
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('hostId', 'name email phone');
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching property.' });
  }
});

export default router;

