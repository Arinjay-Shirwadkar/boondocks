import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['seeker', 'host', 'both'],
      default: 'seeker',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
      default: 'other',
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [72.8777, 19.0760],
      },
      address: {
        type: String,
        default: '',
      },
    },
    radiusKm: {
      type: Number,
      default: 5,
    },
    preferences: {
      food: {
        type: String,
        enum: ['veg', 'non-veg', 'any'],
        default: 'any',
      },
      vices: {
        type: String,
        enum: ['none', 'alcohol', 'smoking', 'all-legal'],
        default: 'none',
      },
      alcohol: {
        type: Boolean,
        default: false,
      },
      smoking: {
        type: Boolean,
        default: false,
      },
      pets: {
        type: Boolean,
        default: false,
      },
      guests: {
        type: String,
        enum: ['none', 'occasional', 'frequent'],
        default: 'occasional',
      },
      sleepTime: {
        type: String,
        enum: ['early-bird', 'night-owl'],
        default: 'early-bird',
      },
      minPrice: {
        type: Number,
        default: 3000,
        min: 0,
      },
      maxPrice: {
        type: Number,
        default: 30000,
        min: 0,
      },
    },
    priorityWeights: {
      food: { type: Number, min: 1, max: 5, default: 3 },
      vices: { type: Number, min: 1, max: 5, default: 3 },
      price: { type: Number, min: 1, max: 5, default: 3 },
      pets: { type: Number, min: 1, max: 5, default: 3 },
      guests: { type: Number, min: 1, max: 5, default: 3 },
      sleepTime: { type: Number, min: 1, max: 5, default: 3 },
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Cascade delete properties and requests when a user is deleted
userSchema.pre('findOneAndDelete', async function () {
  try {
    const user = await this.model.findOne(this.getQuery());
    if (user) {
      const userId = user._id;
      await mongoose.model('Property').deleteMany({ hostId: userId });
      await mongoose.model('Request').deleteMany({
        $or: [{ hostId: userId }, { seekerId: userId }],
      });
    }
  } catch (err) {
    console.error('Error in user findOneAndDelete cascade hook:', err);
  }
});

userSchema.pre('deleteOne', { document: true, query: false }, async function () {
  try {
    const userId = this._id;
    await mongoose.model('Property').deleteMany({ hostId: userId });
    await mongoose.model('Request').deleteMany({
      $or: [{ hostId: userId }, { seekerId: userId }],
    });
  } catch (err) {
    console.error('Error in user deleteOne document cascade hook:', err);
  }
});

userSchema.pre('deleteOne', { document: false, query: true }, async function () {
  try {
    const user = await this.model.findOne(this.getQuery());
    if (user) {
      const userId = user._id;
      await mongoose.model('Property').deleteMany({ hostId: userId });
      await mongoose.model('Request').deleteMany({
        $or: [{ hostId: userId }, { seekerId: userId }],
      });
    }
  } catch (err) {
    console.error('Error in user deleteOne query cascade hook:', err);
  }
});

const User = mongoose.model('User', userSchema);
export default User;
