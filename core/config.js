// core/config.js
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracelayer';

await mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

export {
  AppConfig,
  ActivityLog,
  SuspiciousRequest,
  BlockedIP,
};