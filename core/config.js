// core/config.js
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracelayer';

let isConnected = false;

export async function connectDB() {
  if (!isConnected) {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  }
}
// Login Attempt Schema
const LoginAttemptSchema = new mongoose.Schema({
  appId: String,
  userId: String,
  ip: String,
  status: String, // 'success' or 'fail'
  timestamp: Number,
});

const LoginAttempt = mongoose.model('LoginAttempt', LoginAttemptSchema);
// App-specific config (for rate limits)
const AppConfigSchema = new mongoose.Schema({
  appId: { type: String, unique: true },
  rateLimitMax: Number,
  windowMs: Number,
});
const AppConfig = mongoose.model('AppConfig', AppConfigSchema);

// Activity Log Schema
const ActivityLogSchema = new mongoose.Schema({
  appId: String,
  ip: String,
  route: String,
  method: String,
  userAgent: String,
  timestamp: Number,
  userId: String,         
  synced: Boolean,        //Flag For Firestore sync
});
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

// Suspicious Requests Schema
const SuspiciousSchema = new mongoose.Schema({
  appId: String,
  ip: String,
  attempts: Number,
  timestamp: Number,
  userId: String,        
});
const SuspiciousRequest = mongoose.model('SuspiciousRequest', SuspiciousSchema);

// Blocked IPs Schema (manual or cooldown block)
const BlockedIPSchema = new mongoose.Schema({
  appId: String,
  ip: String,
  reason: String, // 'manual' | 'cooldown'
  blockedAt: Number,
  unblockAt: Number,
});
const BlockedIP = mongoose.model('BlockedIP', BlockedIPSchema);

async function getConfig(appId) {
  return await AppConfig.findOne({ appId });
}
export {
  AppConfig,
  ActivityLog,
  SuspiciousRequest,
  BlockedIP,
  LoginAttempt,
  getConfig
};