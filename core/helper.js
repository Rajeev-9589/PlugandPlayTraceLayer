import {
  AppConfig,
  ActivityLog,
  SuspiciousRequest,
  BlockedIP,
} from './config.js';

const DEFAULT_RATE_LIMIT = 20;
const DEFAULT_WINDOW_MS = 60 * 1000;
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

const ipRequestMap = new Map();
// Fetch rate limit settings from DB (fallback to default)
export const getAppRateLimitConfig = async (appId) => {
  const config = await AppConfig.findOne({ appId });
  return {
    rateLimit: config?.rateLimitMax || DEFAULT_RATE_LIMIT,
    windowMs: config?.windowMs || DEFAULT_WINDOW_MS,
  };
};

// Logrequest saving
export const logRequest = async (appId, req) => {
  const { ip, originalUrl, method, headers } = req;
  const userId = headers['x-user-id'] || '';

  const log = new ActivityLog({
    appId,
    ip,
    route: originalUrl,
    method,
    userAgent: headers['user-agent'],
    timestamp: Date.now(),
    userId,
    synced: false,
  });

  await log.save();
};
// 🔹 Updated: dynamic rate config + userId tracking
export const checkRateLimit = async (appId, ip, userId = '') => {
  const { rateLimit, windowMs } = await getAppRateLimitConfig(appId);
  const currentTime = Date.now();
  const key = `${appId}-${ip}`;

  const cooldown = await BlockedIP.findOne({
    appId,
    ip,
    reason: 'cooldown',
    unblockAt: { $gt: currentTime },
  });

  if (cooldown) return true;

  if (!ipRequestMap.has(key)) {
    ipRequestMap.set(key, []);
  }

  const timestamps = ipRequestMap.get(key).filter(t => currentTime - t < windowMs);
  timestamps.push(currentTime);
  ipRequestMap.set(key, timestamps);

  if (timestamps.length > rateLimit) {
    await SuspiciousRequest.create({
      appId,
      ip,
      attempts: timestamps.length,
      timestamp: currentTime,
      userId,
    });

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
  return list.map(b => ({
    ip: b.ip,
    reason: b.reason,
    unblockAt: b.unblockAt,
  }));
};

// Manually block an IP
export const manuallyBlockIP = async (appId, ip) => {
  const currentTime = Date.now();
  await BlockedIP.create({
    appId,
    ip,
    reason: 'manual',
    blockedAt: currentTime,
    unblockAt: currentTime + 24 * 60 * 60 * 1000,
  });
};