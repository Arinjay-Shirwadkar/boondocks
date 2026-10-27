import express from 'express';
import Request from '../models/Request.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to format request response and strip private contact details if not unlocked
const formatRequestContacts = (requestDoc) => {
  const reqObj = requestDoc.toObject ? requestDoc.toObject() : requestDoc;

  if (reqObj.contactUnlocked) {
    return reqObj;
  }

  // If not unlocked, keep contact details hidden
  return {
    ...reqObj,
    contacts: undefined,
  };
};

// @route   POST /api/requests
// @desc    Seeker sends a join request for a property
// @access  Private (Seeker)
router.post('/', protect, async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({ message: 'propertyId is required.' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // Host cannot request their own property
    if (String(property.hostId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot request your own listing.' });
    }

    // Check if request already exists
    const existing = await Request.findOne({
      seekerId: req.user._id,
      propertyId,
    });

    if (existing) {
      return res.status(409).json({ message: 'You have already requested to join this place.' });
    }

    const newRequest = await Request.create({
      seekerId: req.user._id,
      hostId: property.hostId,
      propertyId,
      status: 'pending',
      seekerConsent: false,
      hostConsent: false,
      contactUnlocked: false,
      chatHistory: [],
    });

    const populated = await Request.findById(newRequest._id)
      .populate('propertyId')
      .populate('hostId', 'name email phone')
      .populate('seekerId', 'name email phone');

    res.status(201).json(formatRequestContacts(populated));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already requested to join this place.' });
    }
    console.error('Create request error:', error);
    res.status(500).json({ message: error.message || 'Server error creating request.' });
  }
});

// @route   GET /api/requests/seeker
// @desc    Get all requests made by the logged-in seeker
// @access  Private
router.get('/seeker', protect, async (req, res) => {
  try {
    const requests = await Request.find({ seekerId: req.user._id })
      .populate('propertyId')
      .populate('hostId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(requests.map(formatRequestContacts));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching seeker requests.' });
  }
});

// @route   GET /api/requests/host
// @desc    Get all incoming requests for the logged-in host's properties
// @access  Private
router.get('/host', protect, async (req, res) => {
  try {
    const requests = await Request.find({ hostId: req.user._id })
      .populate('propertyId')
      .populate('seekerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(requests.map(formatRequestContacts));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching host requests.' });
  }
});

// @route   GET /api/requests
// @desc    Get all requests associated with logged in user (as seeker or host)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [{ seekerId: req.user._id }, { hostId: req.user._id }],
    })
      .populate('propertyId')
      .populate('hostId', 'name email phone')
      .populate('seekerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(requests.map(formatRequestContacts));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching requests.' });
  }
});

// @route   PUT /api/requests/:id/status or PATCH /api/requests/:id
// @desc    Update request status (accepted / rejected)
// @access  Private (Host)
const updateStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'." });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Only host of the property can decide status
    if (String(request.hostId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can accept or decline requests.' });
    }

    request.status = status;
    await request.save();

    const populated = await Request.findById(request._id)
      .populate('propertyId')
      .populate('seekerId', 'name email phone')
      .populate('hostId', 'name email phone');

    res.json(formatRequestContacts(populated));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating request status.' });
  }
};

router.put('/:id/status', protect, updateStatusHandler);
router.patch('/:id', protect, updateStatusHandler);

// @route   POST /api/requests/:id/message AND POST /api/requests/:id/messages
// @desc    Send a message inside request chat
// @access  Private (Seeker or Host of this request)
const sendMessageHandler = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const userIdStr = String(req.user._id);
    const isSeeker = String(request.seekerId) === userIdStr;
    const isHost = String(request.hostId) === userIdStr;

    if (!isSeeker && !isHost) {
      return res.status(403).json({ message: 'Not authorized to participate in this chat.' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Chat is only unlocked after the request is accepted.' });
    }

    const chatMsg = {
      senderId: req.user._id,
      message: message.trim(),
      timestamp: new Date(),
    };

    request.chatHistory.push(chatMsg);
    await request.save();

    const populated = await Request.findById(request._id)
      .populate('propertyId')
      .populate('hostId', 'name email phone')
      .populate('seekerId', 'name email phone');

    res.status(201).json(formatRequestContacts(populated));
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message || 'Server error sending message.' });
  }
};

router.post('/:id/message', protect, sendMessageHandler);
router.post('/:id/messages', protect, sendMessageHandler);

// @route   POST /api/requests/:id/reveal-contact
// @desc    Opt-in to reveal mutual contact details (unlocked only when both agree)
// @access  Private (Seeker or Host of this request)
router.post('/:id/reveal-contact', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const userIdStr = String(req.user._id);
    const isSeeker = String(request.seekerId) === userIdStr;
    const isHost = String(request.hostId) === userIdStr;

    if (!isSeeker && !isHost) {
      return res.status(403).json({ message: 'Not authorized for this request.' });
    }

    if (isSeeker) {
      request.seekerConsent = true;
    }
    if (isHost) {
      request.hostConsent = true;
    }

    // If both have consented, unlock contact info and snapshot details
    if (request.seekerConsent && request.hostConsent) {
      request.contactUnlocked = true;

      const [hostUser, seekerUser] = await Promise.all([
        User.findById(request.hostId),
        User.findById(request.seekerId),
      ]);

      request.contacts = {
        host: {
          name: hostUser?.name || 'Host',
          phone: hostUser?.phone || '',
          email: hostUser?.email || '',
        },
        seeker: {
          name: seekerUser?.name || 'Seeker',
          phone: seekerUser?.phone || '',
          email: seekerUser?.email || '',
        },
      };
    }

    await request.save();

    const populated = await Request.findById(request._id)
      .populate('propertyId')
      .populate('hostId', 'name email phone')
      .populate('seekerId', 'name email phone');

    res.json(formatRequestContacts(populated));
  } catch (error) {
    console.error('Reveal contact error:', error);
    res.status(500).json({ message: error.message || 'Server error processing contact reveal.' });
  }
});

export default router;

