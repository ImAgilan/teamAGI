/**
 * MongoDB Atlas Connection — TeamAGI
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // ── Helpful error if .env not configured ─────────────────
  if (!uri || uri.includes('<username>') || uri.includes('<password>') || uri.includes('xxxxx')) {
    console.error('\n❌ MONGODB_URI is not configured!\n');
    console.error('Steps to fix:');
    console.error('  1. Go to https://cloud.mongodb.com and create a FREE cluster');
    console.error('  2. Click Connect → Drivers → copy the connection string');
    console.error('  3. Open your .env file and replace the MONGODB_URI value');
    console.error('  4. Example: mongodb+srv://john:pass123@cluster0.abc12.mongodb.net/teamagi?retryWrites=true&w=majority\n');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB connection failed: ${error.message}`);
    console.error('Check your MONGODB_URI in the .env file.\n');
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () =>
  console.warn('⚠️  MongoDB disconnected. Reconnecting...')
);
mongoose.connection.on('reconnected', () =>
  console.log('✅ MongoDB reconnected')
);

module.exports = connectDB;
