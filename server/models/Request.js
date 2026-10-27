import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const requestSchema = new mongoose.Schema(
  {
    seekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    seekerConsent: {
      type: Boolean,
      default: false,
    },
    hostConsent: {
      type: Boolean,
      default: false,
    },
    contactUnlocked: {
      type: Boolean,
      default: false,
    },
    contacts: {
      host: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
      },
      seeker: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
      },
    },
    chatHistory: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending or active requests from the same seeker for the same property
requestSchema.index({ seekerId: 1, propertyId: 1 }, { unique: true });

const Request = mongoose.model('Request', requestSchema);
export default Request;

