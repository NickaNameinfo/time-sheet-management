# Time Sheet Management System - Frontend

## Overview
React-based Single Page Application (SPA) for managing employee time sheets, leave management, and project tracking with role-based access control.

## Technology Stack

- **Framework:** React 18.2.0
- **Build Tool:** Vite 4.3.9
- **Routing:** React Router DOM 6.14.1
- **UI Libraries:**
  - Material-UI (MUI) 5.14.3
  - Bootstrap 5.3.0
  - AG Grid (Community & Enterprise) 30.0.6
- **Forms:** React Hook Form 7.45.2
- **HTTP Client:** Axios 1.4.0
- **State Management:** React Context API

## Project Structure

```
front-end/
├── src/
│   ├── Admin/              # Admin-specific components
│   ├── Employee/           # Employee-specific components
│   ├── Hr/                # HR-specific components
│   ├── TeamLead/          # Team Lead components
│   ├── assets/            # Images and static assets
│   ├── components/        # Shared/reusable components
│   │   ├── ErrorBoundary.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── Loading.jsx
│   │   └── ProtectedRoute.jsx
│   ├── config/            # Configuration files
│   │   └── index.js
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx
│   ├── hooks/             # Custom React hooks
│   │   └── useApi.js
│   ├── services/          # API service layer
│   │   └── api.js
│   ├── utils/             # Utility functions
│   │   └── helpers.js
│   ├── App.jsx            # Main routing configuration
│   ├── main.jsx           # Application entry point
│   └── [Login files]      # Authentication components
├── .env.example           # Environment variables template
└── package.json
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_BASE_URL=http://localhost:5173

# Environment
VITE_NODE_ENV=development
```

**Note:** Vite requires the `VITE_` prefix for environment variables to be exposed to the client.

### 3. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```

The production build will be in the `dist` directory.

## Key Features

### ✅ Implemented Improvements

1. **Environment Configuration**
   - Environment variables support via `.env` files
   - Centralized configuration in `config/index.js`
   - Backward compatibility with `common.json`

2. **Centralized API Service**
   - All API calls through `services/api.js`
   - Request/response interceptors
   - Automatic token management
   - Global error handling

3. **Authentication Context**
   - Centralized authentication state
   - Role-based access control
   - Automatic token refresh
   - Protected routes

4. **Error Handling**
   - Global error boundary
   - Standardized error messages
   - User-friendly error components

5. **Code Organization**
   - Modular structure
   - Reusable components
   - Custom hooks for common patterns
   - Utility functions

6. **Code Quality**
   - Removed console.log statements
   - Removed commented code
   - Consistent error handling
   - Loading states

## API Integration

### Using the API Service

```javascript
import { apiService } from '../services/api';

// GET request
const { data, loading, error, refetch } = useApi(apiService.getEmployees);

// POST request
const { mutate, loading, error } = useMutation(apiService.createEmployee);
await mutate(employeeData);
```

### Direct API Calls

```javascript
import { apiService } from '../services/api';

// Simple call
const response = await apiService.getEmployees();
```

## Authentication

### Using Auth Context

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, roles, isAuthenticated, login, logout, hasRole } = useAuth();
  
  // Check roles
  if (hasRole('Admin')) {
    // Admin-only content
  }
}
```

### Protected Routes

```javascript
import ProtectedRoute from '../components/ProtectedRoute';

<ProtectedRoute requiredRole="Admin">
  <AdminComponent />
</ProtectedRoute>
```

## Components

### ErrorBoundary
Catches React errors and displays a user-friendly error page.

### Loading
Displays a loading spinner with optional message.

### ErrorMessage
Displays error messages in a consistent format.

### ProtectedRoute
Wraps routes that require authentication and/or specific roles.

## Custom Hooks

### useApi
Hook for GET requests with loading and error states.

```javascript
const { data, loading, error, refetch } = useApi(
  apiService.getEmployees,
  [], // dependencies
  true // immediate
);
```

### useMutation
Hook for POST/PUT/DELETE requests.

```javascript
const { mutate, loading, error } = useMutation(apiService.createEmployee);
const result = await mutate(data);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_BASE_URL` | Frontend base URL | `http://localhost:5173` |
| `VITE_NODE_ENV` | Environment mode | `development` |

## Migration from Old Code

### Before (Old Pattern)
```javascript
import axios from 'axios';
import commonData from '../common.json';

axios.post(`${commonData.APIKEY}/employeelogin`, data)
  .then(res => {
    localStorage.setItem('token', res.data.tokensss);
  })
  .catch(err => console.log(err));
```

### After (New Pattern)
```javascript
import { useAuth } from '../context/AuthContext';

const { login } = useAuth();
const result = await login(data, 'employee');
if (result.success) {
  // Handle success
}
```

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable names
- Add comments for complex logic

### Error Handling
- Always handle errors in API calls
- Use ErrorMessage component for user-facing errors
- Log errors appropriately (not to console in production)

### State Management
- Use Context API for global state
- Use local state for component-specific state
- Avoid prop drilling

### Performance
- Use React.memo for expensive components
- Implement code splitting for large routes
- Optimize images and assets

## Troubleshooting

### API Connection Issues
- Verify `VITE_API_BASE_URL` in `.env` file
- Check backend server is running
- Verify CORS configuration

### Authentication Issues
- Check token in localStorage
- Verify token hasn't expired
- Check AuthContext is properly set up

### Build Issues
- Clear `node_modules` and reinstall
- Check for TypeScript errors (if using)
- Verify all environment variables are set

## Security Considerations

1. **Token Storage:** Currently using localStorage (consider httpOnly cookies for production)
2. **Environment Variables:** Never commit `.env` files
3. **API Keys:** Keep sensitive keys server-side only
4. **XSS Protection:** Sanitize user inputs
5. **HTTPS:** Always use HTTPS in production

## Future Enhancements

- [ ] Add TypeScript support
- [ ] Implement code splitting
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Implement PWA features
- [ ] Add internationalization (i18n)
- [ ] Improve accessibility
- [ ] Add request caching
- [ ] Implement offline support

## License
ISC

