# Troubleshooting Guide

## Connection Error: Cannot Connect to Server

If you see errors like:
```
The connection errored: The XMLHttpRequest onError callback was called
Cannot connect to server
```

### Solution 1: Check Backend Server is Running

1. **Navigate to backend directory:**
   ```bash
   cd back-end
   ```

2. **Start the backend server:**
   ```bash
   npm start
   ```

3. **Verify server is running:**
   - You should see: `Server running on port 8081`
   - Test in browser: http://localhost:8081/health
   - Should return: `{"Status":"Success","Message":"Server is running"}`

### Solution 2: Update API URL

1. **Check current API URL:**
   - Open: `mobile-app/lib/utils/app_config.dart`
   - Current: `http://localhost:8081`

2. **For Web (Chrome):**
   - Use: `http://localhost:8081` ✅ (should work)

3. **For Mobile Device/Emulator:**
   - Find your computer's IP address:
     - Mac/Linux: `ifconfig | grep "inet "`
     - Windows: `ipconfig`
   - Update to: `http://YOUR_IP:8081`
   - Example: `http://192.168.1.100:8081`

### Solution 3: Configure CORS on Backend

The backend needs to allow requests from your mobile app.

1. **Edit backend `.env` file:**
   ```env
   CORS_ORIGIN=http://localhost:5173,http://localhost:8081,http://localhost:3000
   ```

2. **Or edit `back-end/config/index.js`:**
   ```javascript
   cors: {
     origin: process.env.CORS_ORIGIN?.split(",") || [
       "http://localhost:5173",
       "http://localhost:8081",
       "http://localhost:3000",
       "*" // Allow all origins (development only!)
     ],
   },
   ```

3. **Restart backend server**

### Solution 4: Check Firewall

- Ensure port 8081 is not blocked by firewall
- On Mac: System Preferences → Security → Firewall
- Allow Node.js/your terminal app through firewall

## Login Issues

### "Invalid credentials" Error

1. **Check username/password:**
   - Use correct employee credentials
   - Check database for valid users

2. **Check backend response:**
   - Backend should return: `{"Status":"Success","Result":{"tokensss":"..."}}`
   - Token field is `tokensss` (not `token`)

### "No token received" Error

- Backend might not be returning token correctly
- Check backend logs for errors
- Verify JWT_SECRET_KEY is set in backend `.env`

## Network Issues on Mobile Device

### Android Emulator
- Use `10.0.2.2` instead of `localhost`
- Update: `http://10.0.2.2:8081`

### iOS Simulator
- Use `localhost` or your Mac's IP address
- Update: `http://localhost:8081` or `http://YOUR_MAC_IP:8081`

### Physical Device
- Must use your computer's IP address (not localhost)
- Both device and computer must be on same network
- Update: `http://YOUR_COMPUTER_IP:8081`

## Quick Test

1. **Test backend directly:**
   ```bash
   curl http://localhost:8081/health
   ```
   Should return: `{"Status":"Success","Message":"Server is running"}`

2. **Test login endpoint:**
   ```bash
   curl -X POST http://localhost:8081/employeelogin \
     -H "Content-Type: application/json" \
     -d '{"userName":"testuser","password":"testpass"}'
   ```

3. **Check mobile app console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

## Common Error Messages

| Error | Solution |
|-------|----------|
| `Connection error` | Backend not running or wrong URL |
| `CORS error` | Update CORS_ORIGIN in backend |
| `401 Unauthorized` | Wrong username/password |
| `404 Not Found` | Wrong endpoint URL |
| `500 Server Error` | Check backend logs |

## Still Having Issues?

1. Check backend logs for detailed errors
2. Check browser console (F12) for client-side errors
3. Verify database connection in backend
4. Ensure all environment variables are set correctly

