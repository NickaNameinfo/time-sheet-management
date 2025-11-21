# Migration Guide

## Overview
This guide helps you migrate from the old monolithic `server.js` to the new modular structure.

## Key Changes

### 1. Environment Variables
**Before:** Database credentials and secrets were hardcoded in `server.js`

**After:** All sensitive data is in `.env` file

**Action Required:**
1. Create a `.env` file in the `back-end` directory
2. Copy the template from `.env.example` (if available) or use this:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=signup
DB_NAME_BIOMETRIC=epushserver
JWT_SECRET_KEY=your-strong-secret-key-here
JWT_EXPIRES_IN=1d
PORT=8081
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=public/images
```

### 2. Password Hashing
**Before:** Passwords were stored in plaintext

**After:** All new passwords are automatically hashed using bcrypt

**Action Required:**
- **New employees:** Passwords will be automatically hashed
- **Existing employees:** The login system supports both hashed and plaintext passwords during transition
- **Recommendation:** Update existing employee passwords to trigger hashing

### 3. SQL Injection Fix
**Before:** `filterTimeSheet` endpoint had SQL injection vulnerability

**After:** All queries use parameterized statements

**No action required** - This is automatically fixed.

### 4. Error Handling
**Before:** Inconsistent error responses

**After:** Standardized error format

**Action Required:**
- Update frontend to handle new error response format if needed
- Error format: `{ Status: "Error", Error: "message" }`

### 5. Authentication
**Before:** Token verification was inconsistent

**After:** Centralized authentication middleware

**No action required** - Existing tokens will continue to work.

### 6. Rate Limiting
**Before:** No rate limiting

**After:** Rate limiting enabled on all endpoints

**Action Required:**
- Monitor for legitimate users hitting rate limits
- Adjust limits in `middleware/rateLimiter.js` if needed

## Step-by-Step Migration

### Step 1: Backup Current Code
```bash
# Create a backup of your current server.js
cp server.js server.js.backup
```

### Step 2: Install New Dependencies
```bash
npm install dotenv express-rate-limit morgan
```

### Step 3: Create .env File
Create `.env` file with your configuration (see above).

### Step 4: Test Database Connections
Start the server and verify database connections work:
```bash
npm start
```

You should see:
```
Connected to primary database
Connected to biometric database
Server running on port 8081
```

### Step 5: Test Authentication
Test all login endpoints:
- Admin login
- Employee login
- Team Lead login
- HR login

### Step 6: Test Critical Endpoints
Test the most important endpoints for your application:
- Employee CRUD operations
- Leave management
- Project management

### Step 7: Update Frontend (if needed)
If your frontend expects specific error formats, update it to match the new standardized format.

## Rollback Plan

If you encounter issues:

1. **Restore old server.js:**
   ```bash
   cp server.js.backup server.js
   ```

2. **Remove new dependencies (optional):**
   ```bash
   npm uninstall dotenv express-rate-limit morgan
   ```

3. **Restore old database connection:**
   The old code used direct connections. If you need to rollback, you'll need to restore the original `server.js`.

## Testing Checklist

- [ ] All login endpoints work
- [ ] Employee CRUD operations work
- [ ] Leave management works
- [ ] Project management works
- [ ] File uploads work
- [ ] Authentication middleware works
- [ ] Error handling works correctly
- [ ] Rate limiting doesn't block legitimate users
- [ ] Database connections are stable

## Common Issues

### Issue: "Cannot find module"
**Solution:** Run `npm install` to ensure all dependencies are installed.

### Issue: Database connection fails
**Solution:** 
- Check `.env` file exists and has correct values
- Verify MySQL is running
- Check database names are correct

### Issue: Authentication fails
**Solution:**
- Verify `JWT_SECRET_KEY` in `.env` matches what was used before (or update tokens)
- Check token expiration settings

### Issue: Rate limiting too strict
**Solution:** Adjust limits in `middleware/rateLimiter.js`

## Performance Improvements

The new structure includes:
- **Connection pooling:** Better database performance
- **Async/await:** Better error handling and code readability
- **Modular structure:** Easier to maintain and test

## Security Improvements

1. ✅ SQL injection prevention
2. ✅ Password hashing
3. ✅ Environment variable configuration
4. ✅ Rate limiting
5. ✅ Centralized error handling
6. ✅ Input validation

## Next Steps

After successful migration:
1. Monitor application logs
2. Update existing employee passwords to hashed versions
3. Consider implementing additional security measures:
   - HTTPS
   - Request logging
   - API documentation (Swagger)
   - Unit tests

## Support

If you encounter issues during migration:
1. Check the error logs
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Review the README.md for detailed documentation

