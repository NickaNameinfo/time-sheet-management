# Quick Start Guide - Mobile App

## Option 1: Run on Web (Easiest - Already Enabled ✅)

Web support has been enabled. You can now run the app in Chrome:

```bash
cd mobile-app
flutter run -d chrome
```

**Note:** Some mobile-specific features (push notifications, some offline features) may have limited functionality on web, but the UI and core features will work.

---

## Option 2: Set Up Android Emulator

### Step 1: Install Android Studio

1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and go through the setup wizard

### Step 2: Create Android Virtual Device (AVD)

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 5)
5. Select a system image (e.g., Android 13 - API 33)
6. Click **Finish**

### Step 3: Start Emulator

1. In Device Manager, click the **Play** button next to your AVD
2. Wait for emulator to start

### Step 4: Run Flutter App

```bash
cd mobile-app
flutter run
```

Flutter will automatically detect the running emulator.

---

## Option 3: Set Up iOS Simulator (macOS Only)

### Step 1: Install Xcode

1. Install Xcode from App Store (if not already installed)
2. Open Xcode and accept license agreements
3. Install additional components when prompted

### Step 2: Install CocoaPods

```bash
sudo gem install cocoapods
cd mobile-app/ios
pod install
cd ../..
```

### Step 3: Open Simulator

```bash
# List available simulators
xcrun simctl list devices

# Open iOS Simulator
open -a Simulator

# Or start a specific simulator
flutter emulators --launch apple_ios_simulator
```

### Step 4: Run Flutter App

```bash
cd mobile-app
flutter run
```

---

## Option 4: Use Physical Device

### Android Device

1. Enable **Developer Options** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging
3. Connect device via USB
4. Accept USB debugging prompt on device
5. Run: `flutter run`

### iOS Device (macOS Only)

1. Connect iPhone/iPad via USB
2. Trust the computer on your device
3. In Xcode, select your device as the target
4. Run: `flutter run`

---

## Check Available Devices

To see all available devices:

```bash
flutter devices
```

You should see output like:
```
2 connected devices:

sdk gphone64 arm64 (mobile) • emulator-5554 • android-arm64  • Android 13 (API 33)
Chrome (web)                 • chrome        • web-javascript • Google Chrome 142.0.7444.176
```

---

## Troubleshooting

### No Devices Found

1. **For Android:**
   - Make sure Android Studio is installed
   - Create an AVD in Android Studio
   - Start the emulator before running `flutter run`

2. **For iOS (macOS):**
   - Make sure Xcode is installed
   - Run `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`
   - Open Simulator app

3. **For Physical Device:**
   - Check USB connection
   - Enable USB debugging (Android) or trust computer (iOS)
   - Run `flutter devices` to verify detection

### Flutter Doctor

Check your Flutter setup:

```bash
flutter doctor
```

This will show what's missing or needs configuration.

### Common Issues

**Issue:** "No devices found"
- **Solution:** Start an emulator/simulator first, or connect a physical device

**Issue:** "CocoaPods not installed" (iOS)
- **Solution:** `sudo gem install cocoapods`

**Issue:** "Android SDK not found"
- **Solution:** Install Android Studio and SDK through Android Studio

---

## Recommended Setup for Development

1. **For Quick Testing:** Use web (`flutter run -d chrome`)
2. **For Android Development:** Set up Android Studio + Emulator
3. **For iOS Development (macOS):** Set up Xcode + iOS Simulator
4. **For Real Device Testing:** Connect physical device

---

## Next Steps

Once you have a device running:

1. The app will start with a splash screen
2. Login screen will appear (use your backend credentials)
3. After login, you'll see the home dashboard
4. Test all features:
   - Clock in/out
   - Apply leave
   - View timesheet
   - View shifts
   - Check notifications

---

## Need Help?

- Flutter Documentation: https://flutter.dev/docs
- Flutter Troubleshooting: https://flutter.dev/docs/get-started/install
- Check `flutter doctor` output for specific issues

