import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    return;
  }

  if (uri.includes('<db_username>') || uri.includes('<db_password>')) {
    console.warn('⚠️ MONGODB_URI contains unreplaced placeholders (<db_username>/<db_password>). Please update server/.env with your valid MongoDB Atlas credentials.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected to: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ If using MongoDB Atlas, make sure:');
    console.warn('   1. Your IP address is whitelisted in Atlas Network Access (e.g. 0.0.0.0/0).');
    console.warn('   2. Your database user username & password in server/.env are correct.');
  }
};

