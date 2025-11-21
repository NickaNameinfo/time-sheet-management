# Mobile App Setup Guide

## Quick Start

### 1. Install Flutter

Download and install Flutter from: https://flutter.dev/docs/get-started/install

Verify installation:
```bash
flutter doctor
```

### 2. Clone and Setup

```bash
cd mobile-app
flutter pub get
```

### 3. Configure API URL

Edit `lib/utils/app_config.dart`:
```dart
static const String baseUrl = 'http://your-backend-url:8000';
```

### 4. Run the App

```bash
# List available devices
flutter devices

# Run on connected device/emulator
flutter run

# Run in release mode
flutter run --release
```

## Android Setup

### 1. Minimum Requirements
- Android Studio
- Android SDK (API 21+)
- Java JDK 8+

### 2. Configure

1. Open `android/app/build.gradle`
2. Update `applicationId` if needed
3. Update `minSdkVersion` (currently 21)

### 3. Build APK

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### 4. Build App Bundle (for Play Store)

```bash
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

## iOS Setup

### 1. Minimum Requirements
- macOS
- Xcode 14+
- CocoaPods

### 2. Install CocoaPods

```bash
sudo gem install cocoapods
cd ios
pod install
cd ..
```

### 3. Configure

1. Open `ios/Runner.xcworkspace` in Xcode
2. Update Bundle Identifier
3. Configure signing certificates

### 4. Build iOS App

```bash
flutter build ios --release
```

## Firebase Setup (Optional - for Push Notifications)

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project
3. Add Android app (package: `com.timesheet.mobile`)
4. Add iOS app (bundle ID: from Xcode)

### 2. Download Configuration Files

**Android:**
- Download `google-services.json`
- Place in: `android/app/google-services.json`

**iOS:**
- Download `GoogleService-Info.plist`
- Place in: `ios/Runner/GoogleService-Info.plist`

### 3. Enable Firebase in Code

Uncomment Firebase initialization in:
- `lib/main.dart`
- `lib/services/notification_service.dart`

### 4. Update Dependencies

```bash
flutter pub get
```

## Testing

### Run Tests

```bash
flutter test
```

### Run on Specific Device

```bash
# List devices
flutter devices

# Run on specific device
flutter run -d <device-id>
```

## Troubleshooting

### Build Errors

1. **Gradle errors:** Run `flutter clean` then `flutter pub get`
2. **Pod errors (iOS):** Run `cd ios && pod install`
3. **Version conflicts:** Check `pubspec.yaml` for dependency versions

### API Connection Issues

1. Check API base URL in `app_config.dart`
2. Verify backend is running
3. Check network permissions in `AndroidManifest.xml`
4. For iOS, add network permissions in `Info.plist`

### Offline Issues

1. Check SQLite database initialization
2. Verify storage permissions
3. Check sync interval in `app_config.dart`

## Production Checklist

- [ ] Update API base URL to production URL
- [ ] Configure Firebase (if using push notifications)
- [ ] Update app version in `pubspec.yaml`
- [ ] Update app icons and splash screen
- [ ] Configure signing certificates (Android/iOS)
- [ ] Test on physical devices
- [ ] Test offline functionality
- [ ] Test push notifications
- [ ] Review and update app permissions
- [ ] Build release versions
- [ ] Submit to app stores

## App Store Submission

### Android (Google Play)

1. Build app bundle: `flutter build appbundle --release`
2. Create app in Google Play Console
3. Upload AAB file
4. Fill in store listing
5. Submit for review

### iOS (App Store)

1. Build iOS app: `flutter build ios --release`
2. Archive in Xcode
3. Upload to App Store Connect
4. Fill in app information
5. Submit for review

## Support

For issues or questions:
1. Check Flutter documentation: https://flutter.dev/docs
2. Review backend API documentation
3. Check error logs in console

