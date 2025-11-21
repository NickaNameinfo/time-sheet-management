# Frontend Migration Guide

## Overview
This guide helps you migrate from the old frontend code structure to the new modular, maintainable architecture.

## Key Changes

### 1. Environment Configuration
**Before:** Hardcoded URLs in `common.json`
```javascript
import commonData from "../common.json";
axios.get(`${commonData.APIKEY}/settings`)
```

**After:** Environment variables
```javascript
import config from "./config/index.js";
import { apiService } from "./services/api";
apiService.getSettings()
```

**Action Required:**
1. Create `.env` file from `.env.example`
2. Update API calls to use `apiService`
3. Replace `commonData` imports with `config`

### 2. API Calls
**Before:** Direct axios calls scattered throughout components
```javascript
import axios from "axios";
axios.post(`${commonData.APIKEY}/employeelogin`, data)
  .then(res => { /* ... */ })
  .catch(err => console.log(err));
```

**After:** Centralized API service
```javascript
import { apiService } from "./services/api";
const result = await apiService.login(data);
```

**Action Required:**
- Replace all direct axios calls with `apiService` methods
- Use `useApi` hook for GET requests
- Use `useMutation` hook for POST/PUT/DELETE

### 3. Authentication
**Before:** Manual token management in each component
```javascript
const token = localStorage.getItem("token");
axios.post(`${commonData.APIKEY}/dashboard`, { tokensss: token })
```

**After:** Auth Context
```javascript
import { useAuth } from "./context/AuthContext";
const { user, roles, isAuthenticated, login, logout } = useAuth();
```

**Action Required:**
- Wrap App with `AuthProvider` (already done in `main.jsx`)
- Replace manual auth checks with `useAuth` hook
- Use `login()` function instead of direct API calls

### 4. Error Handling
**Before:** Inconsistent error handling
```javascript
.catch(err => console.log(err));
.catch(err => alert("Error"));
```

**After:** Standardized error handling
```javascript
import ErrorMessage from "./components/ErrorMessage";
<ErrorMessage error={error} onClose={() => setError("")} />
```

**Action Required:**
- Replace `console.log` with proper error handling
- Use `ErrorMessage` component for user-facing errors
- Use `getErrorMessage` utility for consistent error messages

### 5. Loading States
**Before:** No loading indicators
```javascript
const [data, setData] = useState([]);
useEffect(() => {
  axios.get(url).then(res => setData(res.data));
}, []);
```

**After:** Built-in loading states
```javascript
import { useApi } from "./hooks/useApi";
const { data, loading, error } = useApi(apiService.getEmployees);
```

**Action Required:**
- Use `useApi` hook for automatic loading states
- Use `Loading` component for manual loading states

## Step-by-Step Migration

### Step 1: Update Environment Configuration
1. Copy `.env.example` to `.env`
2. Update values if needed
3. Remove `common.json` imports (keep file for backward compatibility)

### Step 2: Update API Calls
For each component with API calls:

1. **Replace imports:**
   ```javascript
   // Old
   import axios from "axios";
   import commonData from "../common.json";
   
   // New
   import { apiService } from "../services/api";
   ```

2. **Replace GET requests:**
   ```javascript
   // Old
   const [data, setData] = useState([]);
   useEffect(() => {
     axios.get(`${commonData.APIKEY}/getEmployee`)
       .then(res => setData(res.data.Result));
   }, []);
   
   // New
   import { useApi } from "../hooks/useApi";
   const { data, loading, error } = useApi(apiService.getEmployees);
   ```

3. **Replace POST/PUT/DELETE:**
   ```javascript
   // Old
   const handleSubmit = (data) => {
     axios.post(`${commonData.APIKEY}/create`, data)
       .then(res => { /* success */ })
       .catch(err => console.log(err));
   };
   
   // New
   import { useMutation } from "../hooks/useApi";
   const { mutate, loading, error } = useMutation(apiService.createEmployee);
   const handleSubmit = async (data) => {
     const result = await mutate(data);
     if (result.success) { /* success */ }
   };
   ```

### Step 3: Update Authentication
1. **Login Components:**
   ```javascript
   // Old
   const Submit = (data) => {
     axios.post(`${commonData.APIKEY}/employeelogin`, data)
       .then(res => {
         localStorage.setItem("token", res.data.tokensss);
         navigate("/Dashboard");
       });
   };
   
   // New
   import { useAuth } from "../context/AuthContext";
   const { login } = useAuth();
   const Submit = async (data) => {
     const result = await login(data, "employee");
     if (result.success) {
       navigate("/Dashboard");
     }
   };
   ```

2. **Protected Components:**
   ```javascript
   // Old
   const token = localStorage.getItem("token");
   useEffect(() => {
     axios.post(`${commonData.APIKEY}/dashboard`, { tokensss: token })
       .then(res => setRoles(res.data.role?.split(",")));
   }, []);
   
   // New
   import { useAuth } from "../context/AuthContext";
   const { roles, isAuthenticated } = useAuth();
   ```

### Step 4: Add Error Handling
```javascript
// Old
.catch(err => console.log(err));

// New
import ErrorMessage from "../components/ErrorMessage";
const [error, setError] = useState(null);
// In catch block or error state
<ErrorMessage error={error} onClose={() => setError(null)} />
```

### Step 5: Add Loading States
```javascript
// Old
const [loading, setLoading] = useState(false);
// Manual loading management

// New
import Loading from "../components/Loading";
const { loading } = useApi(apiService.getData);
{loading && <Loading />}
```

## Component Migration Checklist

For each component, check:

- [ ] Replaced `common.json` imports with `config`
- [ ] Replaced direct `axios` calls with `apiService`
- [ ] Using `useApi` or `useMutation` hooks
- [ ] Using `useAuth` for authentication
- [ ] Added error handling with `ErrorMessage`
- [ ] Added loading states
- [ ] Removed `console.log` statements
- [ ] Removed commented code
- [ ] Updated error messages to use `getErrorMessage`

## Common Patterns

### Pattern 1: Data Fetching
```javascript
// Old Pattern
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  axios.get(url)
    .then(res => {
      setData(res.data.Result);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
}, []);

// New Pattern
import { useApi } from "../hooks/useApi";
const { data, loading, error } = useApi(apiService.getData);
```

### Pattern 2: Form Submission
```javascript
// Old Pattern
const handleSubmit = (data) => {
  axios.post(url, data)
    .then(res => {
      if (res.data.Status === "Success") {
        // success
      }
    })
    .catch(err => console.log(err));
};

// New Pattern
import { useMutation } from "../hooks/useApi";
const { mutate, loading, error } = useMutation(apiService.createData);

const handleSubmit = async (data) => {
  const result = await mutate(data);
  if (result.success) {
    // success
  }
};
```

### Pattern 3: Authentication Check
```javascript
// Old Pattern
const token = localStorage.getItem("token");
const [roles, setRoles] = useState(null);
useEffect(() => {
  axios.post(`${commonData.APIKEY}/dashboard`, { tokensss: token })
    .then(res => setRoles(res.data.role?.split(",")));
}, []);

// New Pattern
import { useAuth } from "../context/AuthContext";
const { roles, isAuthenticated, hasRole } = useAuth();
```

## Breaking Changes

### Minimal Breaking Changes
1. **API Response Format:** Now standardized (Status: "Success"/"Error")
2. **Error Handling:** Errors now use ErrorMessage component
3. **Authentication:** Must use AuthContext instead of manual checks

### Backward Compatibility
- `common.json` still works but deprecated
- Old API endpoints still functional
- Gradual migration possible

## Testing After Migration

1. **Test Authentication:**
   - [ ] Login works for all user types
   - [ ] Logout works correctly
   - [ ] Protected routes redirect properly
   - [ ] Token refresh works

2. **Test API Calls:**
   - [ ] All GET requests work
   - [ ] All POST/PUT/DELETE requests work
   - [ ] Error handling displays correctly
   - [ ] Loading states show properly

3. **Test Navigation:**
   - [ ] All routes accessible
   - [ ] Role-based access works
   - [ ] Redirects work correctly

## Rollback Plan

If issues occur:

1. **Restore old code:**
   ```bash
   git checkout <previous-commit>
   ```

2. **Gradual migration:**
   - Migrate one component at a time
   - Test after each migration
   - Keep old code until verified

## Support

If you encounter issues:
1. Check error messages in browser console
2. Verify environment variables are set
3. Check API service is properly imported
4. Verify AuthContext is wrapped around App

## Next Steps

After successful migration:
1. Remove `common.json` (if no longer needed)
2. Add TypeScript (optional)
3. Add unit tests
4. Optimize bundle size
5. Add code splitting

