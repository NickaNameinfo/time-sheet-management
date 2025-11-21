# Time Sheet Management - Mobile Application

Flutter mobile application for Time Sheet Management System with offline support and push notifications.

## Features

✅ **Mobile Clock-In/Clock-Out**
- Clock in and clock out functionality
- Offline support with automatic sync
- Project and work area tracking

✅ **Mobile Leave Application**
- Apply for leave with date selection
- Multiple leave types (Annual, Sick, Casual, Emergency, Comp Off)
- Offline queue support

✅ **Mobile Timesheet Viewing**
- View timesheet records
- Date range filtering
- Cached data for offline viewing

✅ **Mobile Shift Schedule Viewing**
- View assigned shifts
- Current shift information
- Shift schedule details

✅ **Mobile Notification Center**
- View all notifications
- Mark as read functionality
- Unread count indicator
- Swipe to mark as read

✅ **Offline Mode Support**
- Local SQLite database for offline storage
- Automatic sync when online
- Queue management for pending actions
- Data caching for faster access

✅ **Mobile Push Notifications**
- Local notifications support
- Firebase Cloud Messaging ready (configure when needed)
- Clock-in reminders
- Shift reminders

## Project Structure

```
mobile-app/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── providers/                   # State management
│   │   ├── auth_provider.dart
│   │   ├── attendance_provider.dart
│   │   ├── leave_provider.dart
│   │   ├── timesheet_provider.dart
│   │   ├── shift_provider.dart
│   │   ├── notification_provider.dart
│   │   └── offline_provider.dart
│   ├── screens/                     # UI Screens
│   │   ├── splash_screen.dart
│   │   ├── login_screen.dart
│   │   ├── home_screen.dart
│   │   ├── attendance_screen.dart
│   │   ├── leave_screen.dart
│   │   ├── timesheet_screen.dart
│   │   ├── shift_screen.dart
│   │   └── notification_screen.dart
│   ├── services/                    # Business logic
│   │   ├── api_service.dart
│   │   ├── offline_service.dart
│   │   └── notification_service.dart
│   └── utils/
│       └── app_config.dart          # Configuration
├── pubspec.yaml                     # Dependencies
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Flutter SDK (3.0.0 or higher)
- Android Studio / Xcode (for mobile development)
- Backend API running (default: http://localhost:8000)

### 2. Install Dependencies

```bash
cd mobile-app
flutter pub get
```

### 3. Configure API Base URL

Edit `lib/utils/app_config.dart`:

```dart
static const String baseUrl = 'http://your-api-url:8000';
```

For production:
```dart
static const String baseUrl = 'https://api.yourcompany.com';
```

### 4. Firebase Setup (Optional - for Push Notifications)

1. Create a Firebase project at https://console.firebase.google.com
2. Add Android/iOS apps to your Firebase project
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Place them in:
   - Android: `android/app/google-services.json`
   - iOS: `ios/Runner/GoogleService-Info.plist`
5. Uncomment Firebase initialization in `lib/main.dart` and `lib/services/notification_service.dart`

### 5. Run the Application

```bash
# For Android
flutter run

# For iOS
flutter run -d ios

# For specific device
flutter devices
flutter run -d <device-id>
```

## API Integration

The app integrates with the backend API endpoints:

- **Authentication:** `/employeelogin`, `/dashboard`
- **Attendance:** `/workDetails/clockIn`, `/workDetails/clockOut`
- **Leave:** `/applyLeave`
- **Timesheet:** `/getWorkDetails`
- **Shifts:** `/shifts/assignments`
- **Notifications:** `/notifications`

## Offline Support

The app includes comprehensive offline support:

1. **Local Database:** SQLite database for storing pending actions
2. **Queue System:** Attendance and leave applications are queued when offline
3. **Automatic Sync:** Pending items are synced when connection is restored
4. **Data Caching:** Frequently accessed data is cached for offline viewing
5. **Retry Logic:** Failed syncs are retried automatically

## Push Notifications

### Local Notifications

The app uses `flutter_local_notifications` for local notifications. These work without any server setup.

### Firebase Cloud Messaging (Optional)

To enable Firebase push notifications:

1. Complete Firebase setup (see above)
2. Uncomment Firebase code in:
   - `lib/main.dart`
   - `lib/services/notification_service.dart`
3. Configure FCM token registration in backend

## Building for Production

### Android

```bash
flutter build apk --release
# or
flutter build appbundle --release
```

### iOS

```bash
flutter build ios --release
```

## Key Dependencies

- **provider** - State management
- **dio** - HTTP client
- **sqflite** - Local database
- **shared_preferences** - Local storage
- **connectivity_plus** - Network status
- **firebase_messaging** - Push notifications (optional)
- **flutter_local_notifications** - Local notifications
- **intl** - Date formatting

## Features Implementation Status

✅ All features from UNDEVELOPED_FEATURES.md (lines 73-82) are implemented:

1. ✅ Native mobile app (iOS/Android)
2. ✅ Mobile clock-in/clock-out
3. ✅ Mobile leave application
4. ✅ Mobile timesheet viewing
5. ✅ Mobile shift schedule viewing
6. ✅ Mobile notification center
7. ✅ Offline mode support
8. ✅ Mobile push notifications

## Troubleshooting

### API Connection Issues

- Verify backend API is running
- Check API base URL in `app_config.dart`
- Ensure CORS is configured on backend
- Check network connectivity

### Offline Sync Issues

- Check database permissions
- Verify SQLite database is initialized
- Check sync interval in `app_config.dart`

### Push Notification Issues

- Verify Firebase setup
- Check notification permissions
- Ensure FCM token is registered

## License

This project is part of the Time Sheet Management System.

