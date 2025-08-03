// core/utils/syncLogsToCloud.js
import mongoose from 'mongoose';
import fetch from 'node-fetch'; // Use global fetch if Node >= 18
import { ActivityLog } from '../config.js';

/**
 * Sync unsynced logs from local MongoDB to TraceLayer Cloud.
 * 
 * @param {Object} params
 * @param {string} params.mongoUri - MongoDB connection string
 * @param {string} params.appId - Your app's unique ID
 * @param {string} params.apiKey - Your app's API key
 */
export const syncLogsToCloud = async ({ mongoUri, appId, apiKey }) => {
  try {
    if (!mongoUri || !appId || !apiKey) {
      throw new Error('Missing required parameters: mongoUri, appId, or apiKey');
    }

    // 🔌 Connect to local MongoDB (if not already connected)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // 📦 Fetch unsynced logs
    const unsyncedLogs = await ActivityLog.find({ appId, synced: false }).lean();

    if (unsyncedLogs.length === 0) {
      console.log('[TraceLayer] No new logs to sync.');
      return;
    }

    // ☁️ Send logs to TraceLayer Cloud API
    const response = await fetch('https://tracelayer-cloud-api.vercel.app/api/synclogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appId, apiKey, logs: unsyncedLogs }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to sync logs');
    }

    // ✅ Mark synced logs in MongoDB
    const ids = unsyncedLogs.map(log => log._id);
    await ActivityLog.updateMany({ _id: { $in: ids } }, { $set: { synced: true } });

    console.log(`[TraceLayer] ✅ ${ids.length} logs synced to cloud`);
  } catch (err) {
    console.error('[TraceLayer] ❌ Error syncing logs:', err.message);
  }
};
