import { logRequest, checkRateLimit } from './helper.js';
const traceMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const appId = req.headers['x-app-id'];
    const userId = req.headers['x-user-id'] || ''; // user tracking

    if (!apiKey || !appId) {
      return res.status(403).json({ msg: 'Missing API credentials' });
    }

    const blocked = await checkRateLimit(appId, req.ip, userId);
    if (blocked) {
      return res.status(429).json({ msg: 'You are being rate limited or blocked' });
    }

    await logRequest(appId, req);

    next();
  } catch (err) {
    console.error('[TraceLayer Error]', err);
    res.status(500).json({ msg: 'Internal error in TraceLayer middleware' });
  }
};

export default traceMiddleware;