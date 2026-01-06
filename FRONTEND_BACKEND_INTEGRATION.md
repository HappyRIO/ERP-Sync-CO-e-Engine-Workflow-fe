# Frontend-Backend Integration Guide

## ✅ Completed

1. **API Client Created** (`src/services/api-client.ts`)
   - Handles HTTP requests to backend
   - Automatic JWT token injection
   - Error handling and conversion to ApiError format

2. **Config Updated** (`src/lib/config.ts`)
   - Changed `USE_MOCK_API` to default to `false` (use real API)
   - Can be overridden with `VITE_MOCK_API=true` in `.env`

3. **Auth Service Updated** (`src/services/auth.service.ts`)
   - Supports both mock and real API
   - Real API methods: `loginAPI()`, `signupAPI()`, `getCurrentAuthAPI()`
   - Automatically switches based on `USE_MOCK_API` flag

## 🔄 Next Steps

### 1. Create Frontend .env File

Create `frontend/.env` file:
```env
VITE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. Update Other Services

Services that need to be updated to use real API:

- [ ] `assets.service.ts` - Asset categories
- [ ] `booking.service.ts` - Bookings
- [ ] `jobs.service.ts` - Jobs
- [ ] `co2.service.ts` - CO2 calculations
- [ ] `clients.service.ts` - Clients
- [ ] `dashboard.service.ts` - Dashboard stats (if exists)
- [ ] `sites.service.ts` - Sites
- [ ] `users.service.ts` - User management

### 3. Test Integration

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Login:**
   - Go to login page
   - Use admin credentials:
     - Email: `admin@reuse.com`
     - Password: `admin123`

4. **Verify:**
   - Login should work
   - Token should be stored
   - User data should load
   - Dashboard should show data from backend

## Testing Checklist

- [ ] Login with admin account
- [ ] Signup new user
- [ ] Get current user (after login)
- [ ] View dashboard (should show stats from backend)
- [ ] View asset categories (should load from backend)
- [ ] Create booking (should save to backend)
- [ ] View jobs (should load from backend)

## API Endpoint Mapping

| Frontend Service | Backend Endpoint |
|-----------------|------------------|
| `auth.login()` | `POST /api/auth/login` |
| `auth.signup()` | `POST /api/auth/signup` |
| `auth.getCurrentAuth()` | `GET /api/auth/me` |
| `assets.getCategories()` | `GET /api/asset-categories` |
| `booking.create()` | `POST /api/bookings` |
| `booking.getBookings()` | `GET /api/bookings` |
| `jobs.getJobs()` | `GET /api/jobs` |
| `dashboard.getStats()` | `GET /api/dashboard/stats` |

## Troubleshooting

### CORS Errors
- Backend CORS is already configured
- Make sure backend is running on port 3000
- Check browser console for CORS errors

### 401 Unauthorized
- Check if token is being sent in Authorization header
- Verify token is stored in localStorage
- Check if token is expired

### 404 Not Found
- Verify backend is running
- Check API_BASE_URL is correct
- Verify endpoint path matches backend routes

### Network Errors
- Check backend server is running
- Verify `http://localhost:3000/health` responds
- Check firewall/antivirus blocking connections

## Rollback to Mocks

If you need to switch back to mocks temporarily:

1. Set in `.env`:
   ```env
   VITE_MOCK_API=true
   ```

2. Or update `config.ts`:
   ```typescript
   export const USE_MOCK_API = true;
   ```

