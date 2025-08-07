import axios from "axios";
import {
  ActivityLog,
  LoginAttempt,
  BlockedIP,
  SuspiciousRequest,
  AppConfig,
  connectDB,
} from "../config.js"; 

async function getConfig(appId) {
  return AppConfig.findOne({ appId });
}

/**
 * Syncs logs from all collections to cloud and marks synced activity logs.
 */
export async function syncLogsToCloud(appId, apiKey) {
  try {
    // Ensure DB is connected before any DB calls
    await connectDB();

    // 1. Fetch app config
    const config = await getConfig(appId);
    if (!config) {
      return { success: false, message: "App not found" };
    }

    // 2. Fetch logs
    const activityLogs = await ActivityLog.find({ appId, synced: false }).lean();
    const loginAttempts = await LoginAttempt.find({ appId }).lean();
    const blockedIPs = await BlockedIP.find({ appId }).lean();
    const suspiciousRequests = await SuspiciousRequest.find({ appId }).lean();

    // 3. Construct payload
    const payload = {
      appId,
      apiKey,
      activityLogs,
      loginAttempts,
      blockedIPs,
      suspiciousRequests,
    };

    // 4. Send to TraceLayer Cloud API
    const response = await axios.post(
      process.env.TRACELAYER_API_URL || "https://tracelayer-cloud-api.vercel.app/api/synclogs",
      payload
    );

    // 5. On success, mark synced ActivityLogs
    if (response.data && response.data.success) {
      const syncedIds = activityLogs.map((log) => log._id);
      if (syncedIds.length > 0) {
        await ActivityLog.updateMany(
          { _id: { $in: syncedIds } },
          { $set: { synced: true } }
        );
      }

      return {
        success: true,
        message: "Logs synced successfully",
        syncedCount: syncedIds.length,
      };
    } else {
      return {
        success: false,
        message: "Cloud response unsuccessful",
        cloudResponse: response.data,
      };
    }
  } catch (err) {
    console.error("TraceLayer sync error:", err);
    return {
      success: false,
      message: "Internal sync error",
      error: err.message,
    };
  }
}
