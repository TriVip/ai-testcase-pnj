import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Sign-in is Google-only now: drop any credentials left from the old
    // username/password login. Native driver, because Mongoose strips update
    // paths that are no longer in the schema. Idempotent, cheap once empty.
    await conn.connection.collection('users').updateMany(
      { $or: [{ password: { $exists: true } }, { username: { $exists: true } }] },
      { $unset: { password: '', username: '' } }
    );
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
