# Time Sheet Management System - Backend

## Overview
This is a Node.js/Express REST API for managing employee time sheets, leave management, and project tracking.

## Project Structure

```
back-end/
├── config/
│   ├── database.js      # Database connection pools
│   └── index.js         # Configuration settings
├── controllers/         # Business logic controllers
│   ├── authController.js
│   ├── employeeController.js
│   ├── leaveController.js
│   ├── projectController.js
│   ├── teamLeadController.js
│   ├── hrController.js
│   ├── settingsController.js
│   └── notificationController.js
├── middleware/
│   ├── auth.js          # Authentication & authorization
│   ├── errorHandler.js  # Error handling middleware
│   └── rateLimiter.js   # Rate limiting middleware
├── routes/              # API route definitions
│   ├── authRoutes.js
│   ├── employeeRoutes.js
│   ├── leaveRoutes.js
│   ├── projectRoutes.js
│   ├── teamLeadRoutes.js
│   ├── hrRoutes.js
│   ├── settingsRoutes.js
│   └── notificationRoutes.js
├── utils/
│   ├── response.js      # Standardized response helpers
│   └── validation.js     # Validation utilities
├── public/
│   └── images/          # Uploaded files
├── server.js            # Main application entry point
└── package.json
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=signup
DB_NAME_BIOMETRIC=epushserver

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRES_IN=1d

# Server Configuration
PORT=8081
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
UPLOAD_DIR=public/images
```

**Important:** Never commit the `.env` file to version control. Use `.env.example` as a template.

### 3. Database Setup
Ensure MySQL is running and the databases (`signup` and `epushserver`) are created.

### 4. Run the Server
```bash
# Development
npm start

# With nodemon (auto-restart on changes)
npx nodemon server.js
```

## Security Improvements

### ✅ Implemented
1. **Password Hashing**: All passwords are now hashed using bcrypt
2. **SQL Injection Prevention**: All queries use parameterized statements
3. **Environment Variables**: Sensitive data moved to `.env` file
4. **Rate Limiting**: API endpoints protected against brute force attacks
5. **JWT Authentication**: Secure token-based authentication
6. **Error Handling**: Centralized error handling with proper error messages
7. **Input Validation**: Express-validator for request validation

### 🔒 Security Best Practices
- Change `JWT_SECRET_KEY` to a strong, random string in production
- Use HTTPS in production
- Regularly update dependencies
- Implement proper logging and monitoring
- Use connection pooling for database connections

## API Endpoints

### Authentication
- `POST /login` - Admin login
- `POST /employeelogin` - Employee login
- `POST /teamLeadlogin` - Team lead login
- `POST /hrLogin` - HR login
- `POST /dashboard` - Verify token and get user info
- `GET /logout` - Logout

### Employee Management
- `POST /create` - Create employee
- `GET /getEmployee` - Get all employees
- `GET /get/:id` - Get employee by ID
- `PUT /update/:id` - Update employee
- `DELETE /delete/:id` - Delete employee
- `GET /employeeCount` - Get employee count

### Leave Management
- `POST /applyLeave` - Apply for leave
- `POST /applycompOff` - Apply compensatory off
- `GET /getLeaveDetails` - Get all leave details
- `GET /getcompOffDetails` - Get all comp off details
- `PUT /updateLeave/:id` - Update leave
- `PUT /updateCompOff/:compOffId` - Update comp off
- `DELETE /deleteLeave/:id` - Delete leave
- `DELETE /deletecompOff/:id` - Delete comp off

### Project Management
- `POST /project/create` - Create project
- `GET /getProject` - Get all projects
- `GET /getProject/:id` - Get project by ID
- `PUT /project/update/:projectId` - Update project
- `PUT /project/update/completion/:projectId` - Update project completion
- `DELETE /project/delete/:id` - Delete project
- `POST /project/addWorkDetails` - Add work details
- `PUT /project/updateWorkDetails/:id` - Update work details
- `GET /getWrokDetails` - Get all work details
- `GET /getBioDetails` - Get biometric details
- `POST /filterTimeSheet` - Filter time sheet data

### Team Lead Management
- `POST /lead/create` - Create team lead
- `GET /getLead` - Get all team leads
- `DELETE /lead/delete/:id` - Delete team lead

### HR Management
- `POST /hr/create` - Create HR
- `GET /getHr` - Get all HR
- `DELETE /hr/delete/:id` - Delete HR

### Settings & Configuration
- `GET /settings` - Get settings
- `POST /create/updates` - Create update/announcement
- `DELETE /updates/delete/:id` - Delete update
- `GET /discipline` - Get disciplines
- `POST /create/discipline` - Create discipline
- `DELETE /discipline/delete/:id` - Delete discipline
- `GET /designation` - Get designations
- `POST /create/designation` - Create designation
- `DELETE /designation/delete/:id` - Delete designation
- `GET /areaofwork` - Get areas of work
- `POST /create/areaofwork` - Create area of work
- `DELETE /areaofwork/delete/:id` - Delete area of work
- `GET /variation` - Get variations
- `POST /create/variation` - Create variation
- `DELETE /variation/delete/:id` - Delete variation
- `GET /adminCount` - Get admin count

### Notifications
- `POST /sendNotification` - Send notification

## Response Format

### Success Response
```json
{
  "Status": "Success",
  "Message": "Optional message",
  "Result": { /* data */ }
}
```

### Error Response
```json
{
  "Status": "Error",
  "Error": "Error message"
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **File Upload**: 20 requests per 15 minutes per IP

## Database Connection

The application uses connection pooling for better performance:
- Primary database pool: 10 connections
- Biometric database pool: 10 connections

## Migration Notes

### Breaking Changes
1. **Password Storage**: Existing plaintext passwords will need to be migrated
   - New passwords are automatically hashed
   - Employee login supports both hashed and plaintext (for backward compatibility)

2. **Environment Variables**: Database credentials must be moved to `.env` file

3. **Error Responses**: Error response format is now standardized

### Backward Compatibility
- Employee login supports both hashed and plaintext passwords during transition
- Legacy database connection methods (`con`, `con1`) are still available

## Development

### Code Style
- Use ES6 modules (import/export)
- Use async/await for asynchronous operations
- Follow RESTful API conventions
- Use meaningful variable and function names

### Testing
```bash
# Run tests (when implemented)
npm test
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET_KEY`
3. Configure proper CORS origins
4. Enable HTTPS
5. Set up proper logging and monitoring
6. Use PM2 for process management:
   ```bash
   pm2 start server.js --name timesheet-api
   ```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure databases exist

### Authentication Issues
- Verify JWT_SECRET_KEY is set
- Check token expiration
- Ensure cookies are enabled (for admin/HR/TeamLead login)

### File Upload Issues
- Ensure `public/images` directory exists
- Check file permissions
- Verify multer configuration

## License
ISC

