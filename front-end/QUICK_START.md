# Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd front-end
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

Edit `.env` and update if needed:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_BASE_URL=http://localhost:5173
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## Common Tasks

### Making API Calls

**GET Request:**
```javascript
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';

const { data, loading, error } = useApi(apiService.getEmployees);
```

**POST Request:**
```javascript
import { useMutation } from '../hooks/useApi';
import { apiService } from '../services/api';

const { mutate, loading, error } = useMutation(apiService.createEmployee);

const handleSubmit = async (data) => {
  const result = await mutate(data);
  if (result.success) {
    // Success!
  }
};
```

### Using Authentication

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, roles, isAuthenticated, login, logout, hasRole } = useAuth();
  
  if (hasRole('Admin')) {
    // Admin content
  }
}
```

### Displaying Errors

```javascript
import ErrorMessage from '../components/ErrorMessage';

const [error, setError] = useState(null);

<ErrorMessage error={error} onClose={() => setError(null)} />
```

### Showing Loading States

```javascript
import Loading from '../components/Loading';

const { loading } = useApi(apiService.getData);

{loading && <Loading message="Loading data..." />}
```

### Protected Routes

```javascript
import ProtectedRoute from '../components/ProtectedRoute';

<ProtectedRoute requiredRole="Admin">
  <AdminComponent />
</ProtectedRoute>
```

---

## File Structure Quick Reference

```
src/
├── components/        # Reusable UI components
├── config/           # Configuration (use config, not common.json)
├── context/          # React Context (AuthContext)
├── hooks/            # Custom hooks (useApi, useMutation)
├── services/         # API service (apiService)
└── utils/            # Helper functions
```

---

## Migration Checklist

When updating a component:

- [ ] Replace `common.json` with `config`
- [ ] Replace `axios` calls with `apiService`
- [ ] Use `useApi` or `useMutation` hooks
- [ ] Use `useAuth` for authentication
- [ ] Add `ErrorMessage` for errors
- [ ] Add loading states
- [ ] Remove `console.log`
- [ ] Remove commented code

---

## Troubleshooting

**API not working?**
- Check `.env` file exists and has correct values
- Verify backend is running on port 8081
- Check browser console for errors

**Authentication not working?**
- Verify `AuthProvider` wraps App in `main.jsx`
- Check token in localStorage
- Verify API service interceptors are working

**Build errors?**
- Clear `node_modules` and reinstall
- Check all imports are correct
- Verify environment variables are set

---

## Need Help?

- See `README.md` for detailed documentation
- See `MIGRATION_GUIDE.md` for migration steps
- See `REFACTORING_SUMMARY.md` for what changed

