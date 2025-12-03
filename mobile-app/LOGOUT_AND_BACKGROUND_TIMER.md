# Logout and Background Timer Implementation

## Summary
This document describes the implementation of proper logout functionality and background timer for check-in time tracking.

## Changes Made

### 1. Logout Functionality

#### API Service (`lib/services/api_service.dart`)
- Added `logout()` method that calls the backend `/logout` endpoint

#### Auth Provider (`lib/providers/auth_provider.dart`)
- Updated `logout()` method to:
  - Call backend logout API
  - Clear all local storage (token, user data, attendance state)
  - Stop background timer
  - Clear authentication state

#### Logout Buttons Added
- **Employee Dashboard** (`lib/screens/employee_dashboard_screen.dart`):
  - Added logout button in AppBar
  - Shows confirmation dialog before logout
  - Navigates to login screen after logout

- **HR Dashboard** (`lib/screens/hr_dashboard_screen.dart`):
  - Added logout button in AppBar
  - Shows confirmation dialog before logout
  - Navigates to login screen after logout

- **Team Lead Dashboard** (`lib/screens/teamlead_dashboard_screen.dart`):
  - Added logout button in AppBar
  - Shows confirmation dialog before logout
  - Navigates to login screen after logout

- **Profile Screen** (`lib/screens/employee_profile_screen.dart`):
  - Added logout button at bottom of profile
  - Shows confirmation dialog before logout
  - Navigates to login screen after logout

### 2. Background Timer for Check-In

#### Background Timer Service (`lib/services/background_timer_service.dart`)
- Created service to manage background timer tasks
- Saves clock-in state to SharedPreferences
- Starts/stops background periodic tasks using WorkManager
- Updates working hours in background every 15 minutes

#### Background Callback (`lib/services/background_callback.dart`)
- Separate file for WorkManager callback dispatcher
- Top-level function required by WorkManager
- Updates working hours when background task runs

#### Employee Home Screen Updates (`lib/screens/employee_home_screen.dart`)
- Saves clock-in state to SharedPreferences when checking in
- Starts background timer when clocking in
- Stops background timer when clocking out
- Restores clock-in state from SharedPreferences on app restart
- Automatically resumes timer if user was clocked in

#### Main App Initialization (`lib/main.dart`)
- Initializes BackgroundTimerService on app startup
- Automatically starts background timer if user is clocked in

### 3. Dependencies Added

#### `pubspec.yaml`
- `workmanager: ^0.5.2` - For background periodic tasks
- `flutter_background_service: ^5.0.5` - For background services (optional, added but using workmanager)

### 4. Android Permissions

#### `android/app/src/main/AndroidManifest.xml`
- Added `WAKE_LOCK` permission
- Added `FOREGROUND_SERVICE` permission
- Added `FOREGROUND_SERVICE_DATA_SYNC` permission

## How It Works

### Logout Flow
1. User clicks logout button
2. Confirmation dialog appears
3. If confirmed:
   - Backend logout API is called
   - All local data is cleared (token, user data, clock-in state)
   - Background timer is stopped
   - User is navigated to login screen

### Background Timer Flow
1. **On Check-In:**
   - Clock-in time and work detail ID are saved to SharedPreferences
   - Background periodic task is registered (runs every 15 minutes)
   - Timer continues even when app is in background or closed

2. **Background Task Execution:**
   - Runs every 15 minutes
   - Calculates current working hours from saved clock-in time
   - Updates work details in backend with current hours
   - Saves updated hours to SharedPreferences

3. **On App Restart:**
   - Checks SharedPreferences for saved clock-in state
   - If clocked in, restores state and resumes timer
   - Background task continues running

4. **On Check-Out:**
   - Background timer is stopped
   - All saved clock-in state is cleared
   - Final hours are updated in backend

## Testing

### Test Logout
1. Login to the app
2. Click logout button (in AppBar or Profile)
3. Confirm logout
4. Verify: App navigates to login screen
5. Verify: Cannot access dashboard without re-login

### Test Background Timer
1. Clock in from home screen
2. Close the app completely
3. Wait 15+ minutes
4. Reopen the app
5. Verify: Working hours have been updated
6. Verify: Timer continues from where it left off

## Notes

- Background timer runs every 15 minutes (configurable in `BackgroundTimerService`)
- Timer state persists across app restarts
- Logout clears all session data including background timer
- Background tasks require network connection (configured in constraints)

