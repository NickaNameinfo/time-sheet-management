# CORS Configuration Fix

## Issue
Flutter web app getting CORS error when trying to connect to backend API.

## Solution Applied

The backend CORS configuration has been updated to:

1. **Allow all localhost origins in development mode**
   - Any port on localhost is now allowed
   - This includes Flutter web app which runs on random ports

2. **Maintain security for production**
   - In production, only specified origins are allowed
   - Set `CORS_ORIGIN` in `.env` for production

## How It Works

The CORS middleware now:
- Allows requests with no origin (mobile apps, curl, etc.)
- Checks against configured allowed origins
- **In development**: Automatically allows any `http://localhost:*` origin
- **In production**: Only allows origins specified in `CORS_ORIGIN`

## Restart Required

**IMPORTANT:** You must restart the backend server for changes to take effect:

```bash
cd back-end
# Stop the current server (Ctrl+C)
npm start
```

## Testing

After restarting, the Flutter web app should be able to connect without CORS errors.

Test by:
1. Opening Flutter app in Chrome
2. Trying to login
3. Check Network tab - should see 200 status instead of CORS error

## Production Configuration

For production, set in `.env`:

```env
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
NODE_ENV=production
```

This will restrict CORS to only your production domains.

