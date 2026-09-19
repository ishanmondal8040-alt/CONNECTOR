import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/connector', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ MongoDB Connected: ' + conn.connection.host);
  } catch (error) {
    console.warn('⚠️ MongoDB Connection Warning: ' + error.message + ' (Running in offline/bypassed mode)');
  }
};

export default connectDB;
