# Reset Rate Limit

If you're getting rate limited and need to reset it:

## Option 1: Restart the Server (Recommended)
Simply restart your backend server. The rate limiter uses in-memory storage, so restarting clears all counters.

```bash
# Stop the server (Ctrl+C) and restart it
cd back-end
node server.js
```

## Option 2: Wait for Time Window
- Development: Wait 5 minutes
- Production: Wait 15 minutes

## Option 3: Temporarily Disable Rate Limiting
Add this to your `.env` file:
```
DISABLE_RATE_LIMIT=true
```

Then restart the server. **Remember to remove this in production!**

## Option 4: Check Server Logs
Check your server console for the actual error message. The rate limiter only blocks after multiple failed login attempts.

