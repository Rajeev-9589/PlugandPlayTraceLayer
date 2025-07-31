import { ActivityLog, SuspiciousRequest, BlockedIP } from './config.js';

const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

const ipRequestMap = new Map();

export const logRequest = async (appId, req) => {
  const { ip, originalUrl, method, headers } = req;

  const log = new ActivityLog({
    appId,
    ip,
    route: originalUrl,
    method,
    userAgent: headers['user-agent'],
    timestamp: Date.now(),
  });

  await log.save();
};

export const checkRateLimit = async (appId, ip) => {
  const key = `${appId}-${ip}`;
  const currentTime = Date.now();

  // Cooldown Check
  const cooldown = await BlockedIP.findOne({
    appId,
    ip,
    reason: 'cooldown',
    unblockAt: { $gt: currentTime },
  });

  if (cooldown) {
    return true;
  }

  // In-memory request tracking
  if (!ipRequestMap.has(key)) {
    ipRequestMap.set(key, []);
  }

  const timestamps = ipRequestMap.get(key).filter(t => currentTime - t < WINDOW_MS);
  timestamps.push(currentTime);
  ipRequestMap.set(key, timestamps);

  if (timestamps.length > RATE_LIMIT) {
    // Save to suspicious
    const suspicious = new SuspiciousRequest({
      appId,
      ip,
      attempts: timestamps.length,
      timestamp: currentTime,
    });
    await suspicious.save();

    // Add cooldown block
    await BlockedIP.create({
      appId,
      ip,
      reason: 'cooldown',
      blockedAt: currentTime,
      unblockAt: currentTime + COOLDOWN_DURATION,
    });

    return true;
  }

  return false;
};

// Get all currently blocked IPs for dashboard
export const getBlockedIPs = async (appId) => {
  const now = Date.now();
  const list = await BlockedIP.find({ appId, unblockAt: { $gt: now } });
  return list.map(b => ({ ip: b.ip, reason: b.reason, unblockAt: b.unblockAt }));
};

// Manually block an IP
export const manuallyBlockIP = async (appId, ip) => {
  const currentTime = Date.now();
  await BlockedIP.create({
    appId,
    ip,
    reason: 'manual',
    blockedAt: currentTime,
    unblockAt: currentTime + 24 * 60 * 60 * 1000, // 24 hr block
  });
};
