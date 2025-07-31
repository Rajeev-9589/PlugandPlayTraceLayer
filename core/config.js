// core/config.js
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracelayer';

await mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Dev Schema
const DevUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  appId: String,
  apiKey: String,
  password: String,
});
const DevUser = mongoose.model('DevUser', DevUserSchema);

// Activity Log Schema
const ActivityLogSchema = new mongoose.Schema({
  appId: String,
  ip: String,
  route: String,
  method: String,
  userAgent: String,
  timestamp: Number,
});
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

// Suspicious Requests Schema
const SuspiciousSchema = new mongoose.Schema({
  appId: String,
  ip: String,
  attempts: Number,
  timestamp: Number,
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
  DevUser,
  ActivityLog,
  SuspiciousRequest,
  BlockedIP,
};
