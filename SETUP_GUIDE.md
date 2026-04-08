# Step-by-Step Setup & Run Guide

This guide walks you through setting up and running the Escape authentication app on Android and iOS.

## Prerequisites

Before you begin, ensure you have:

1. **Flutter SDK** (3.10.7+)
   - Download from [flutter.dev](https://flutter.dev/docs/get-started/install)
   - Add to PATH environment variable
   
2. **Dart SDK** (included with Flutter)

3. **Git** (optional, for version control)

4. **Android Studio** (for Android development)
   - Includes Android SDK and emulator
   - Download from [developer.android.com](https://developer.android.com/studio)

5. **Xcode** (for iOS development - Mac only)
   - Download from App Store
   - Or install via: `xcode-select --install`

---

## System Requirements

### Windows (Android Development)
- Windows 10 or 11
- 8GB RAM minimum (16GB recommended)
- 5GB disk space minimum
- USB 3.0 port for device connection

### macOS (iOS & Android Development)
- macOS 10.13+
- Apple Silicon or Intel processor
- 8GB RAM minimum (16GB recommended)
- Xcode 11.0+

### Linux (Android Development)
- Ubuntu 18.04+ or other distributions
- 8GB RAM minimum
- Git, curl, unzip

---

## Installation Steps

### Step 1: Verify Flutter Installation

```bash
# Check Flutter version
flutter --version

# Check Flutter doctor
flutter doctor
```

Expected output:
```
Flutter 3.x.x • channel stable
```

If not installed, follow the [official Flutter installation guide](https://flutter.dev/docs/get-started/install).

### Step 2: Clone/Navigate to Project

```bash
# Navigate to project directory
cd c:\Escape\escape_app

# List files to verify project structure
dir
```

You should see: `lib/`, `android/`, `ios/`, `pubspec.yaml`, etc.

### Step 3: Install Dependencies

```bash
# Get all dependencies
flutter pub get

# Clean build (optional, if issues occur)
flutter clean
flutter pub get
```

Expected output:
```
Running "flutter pub get" in escape_app...
Running "flutter pub get" in escape_app... 
Got dependencies in 8.5s.
```

### Step 4: Verify Setup

```bash
# Run Flutter doctor to check setup
flutter doctor

# Run analyzer to check for errors
flutter analyze

# Format code
dart format lib/
```

---

## Running on Android

### Option A: Android Emulator (Recommended for beginners)

#### Setup Android Emulator

1. **Open Android Studio**
   - Click "More Options" → "Virtual Device Manager"
   - OR Tools → Device Manager

2. **Create New Virtual Device**
   - Click "+ Create Device"
   - Select a device (e.g., "Pixel 4")
   - Click "Next"

3. **Select System Image**
   - Choose API Level 31 or higher
   - Download if needed
   - Click "Next" → "Finish"

4. **Launch Emulator**
   - Click the play (▶️) button next to your device
   - Wait for emulator to boot (1-2 minutes)

#### Run App on Emulator

```bash
# Verify device is detected
flutter devices

# Run the app
flutter run

# Or run with verbose output
flutter run -v
```

Expected output:
```
✓ Built build\app\outputs\app-release.apk
✓ Installed build\app\outputs\app.apk
✓ Waiting for Pixel 4 to report its views...
✓ Resuming app...
```

**Control the App:**
- `R`: Hot reload
- `P`: Toggle debug paint
- `Q`: Quit
- `H`: Help

### Option B: Physical Android Device

#### Prerequisites
- USB cable
- Developer Mode enabled
- USB Debugging enabled

#### Enable Developer Mode

1. Go to **Settings**
2. Scroll to **About Phone**
3. Tap **Build Number** 7 times
4. You'll see "You are now a developer"

#### Enable USB Debugging

1. Go to **Settings** → **Developer Options**
2. Enable **USB Debugging**
3. Connect phone via USB to computer
4. Tap **Allow** on phone when prompted

#### Run App

```bash
# Verify device connection
flutter devices

# Should show: "your-device (mobile) • Android 12 • arm64-v8a"

# Run the app
flutter run
```

### Troubleshooting Android

**Device not detected:**
```bash
# Restart adb server
adb kill-server
adb start-server
flutter devices
```

**Build fails:**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

**Permission denied (emulator):**
```bash
# Check Android SDK path in environment variables
# Reinstall Android SDK if necessary
```

**Gradle sync error:**
```bash
# Update gradle and dependencies
cd android
./gradlew --version
./gradlew clean
cd ..
flutter pub get
```

---

## Running on iOS

### Prerequisites (Mac only)
- Xcode 11.0+
- CocoaPods
- iPhone Simulator or physical device

### Option A: iOS Simulator (Recommended for beginners)

#### Install Xcode (if not already installed)

```bash
# Install Command Line Tools
xcode-select --install

# Install full Xcode from App Store
# Or: brew install xcode
```

#### Boot iOS Simulator

```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 14"

# Or open directly
open -a Simulator
```

#### Run App on Simulator

```bash
# Verify simulator is running
flutter devices

# Should show: "iPhone 14 (simulator) • iOS 16.x • Darwin"

# Run the app
flutter run

# Or specify the device
flutter run -d "iPhone 14"
```

**Control the App:**
- Hardware → Rotate (⌘←/⌘→)
- Hardware → Home (⌘H)
- Hardware → Lock (⌘L)

### Option B: Physical iPhone

#### Prerequisites
- Apple Developer Account
- iPhone with development certificate
- Trust the developer certificate on phone

#### Run App

1. **Connect iPhone** via USB

2. **Open Xcode project:**
   ```bash
   open ios/Runner.xcworkspace
   ```

3. **Select project** and configure signing:
   - Select "Runner" in Project Navigator
   - Select your team in Signing

4. **Run from Flutter:**
   ```bash
   flutter devices  # Verify iPhone is detected
   flutter run      # Run on iPhone
   ```

### Troubleshooting iOS

**CocoaPods error:**
```bash
cd ios
pod repo update
pod install
cd ..
flutter pub get
flutter run
```

**iOS build fails:**
```bash
# Clean and rebuild
flutter clean
cd ios
rm -rf Podfile.lock Pods
pod install
cd ..
flutter pub get
flutter run
```

**Device not trusted:**
1. On iPhone: Go to Settings → General → Device Management
2. Trust your developer account
3. Disconnect and reconnect
4. Try running again

**Permission denied:**
```bash
# Check iOS project configuration
# Ensure app has required permissions in Info.plist
```

---

## Production Builds

### Android APK (Debug)

```bash
# Create debug APK for testing
flutter build apk

# Output: build/app/outputs/flutter-app.apk
```

### Android APK (Release)

```bash
# Create release APK for production
flutter build apk --release

# Output: build/app/outputs/app-release.apk

# Install on device
adb install build/app/outputs/app-release.apk
```

### Android App Bundle (Google Play)

```bash
# Create App Bundle for Google Play Store
flutter build appbundle --release

# Output: build/app/outputs/app-release.aab
```

### iOS App (Release)

```bash
# Build for iOS App Store
flutter build ios --release

# This generates Xcode project for App Store deployment
# Open in Xcode and follow App Store submission process
open ios/Runner.xcworkspace
```

---

## Development Workflow

### Hot Reload Development

```bash
# Start app with hot reload enabled
flutter run

# Make code changes
# Type 'r' to hot reload
# Type 'R' to hot restart (reload state)
# Type 'q' to quit
```

### With Chrome DevTools

```bash
# Run with verbose output
flutter run -v

# DevTools will open at: http://localhost:9100

# Or open manually:
# In Terminal: flutter pub global activate devtools
# Then: devtools

# Connect to running app:
# Click "Connect to Running App"
# Select your device
```

### Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/validators_test.dart

# Run with coverage
flutter test --coverage

# Generate coverage report
# Windows: type build\coverage\lcov.info
# Mac: cat build/coverage/lcov.info
```

---

## Debugging

### Print Debugging

```dart
// In Dart code
print('Debug message: $variable');

// In Terminal
// Messages appear with timestamp in logcat/console
```

### Breakpoint Debugging

```bash
# Run with debugger attached
flutter run

# In VS Code or Android Studio:
# 1. Set breakpoints by clicking line numbers
# 2. App will pause at breakpoints
# 3. Use console to inspect variables
# 4. Step through code with debugging controls
```

### Device Logs

```bash
# Android logs
flutter logs  # Real-time logs
adb logcat   # All Android logs

# iOS logs
flutter logs  # Real-time logs
```

---

## Performance Profiling

### Build Performance

```bash
flutter build apk --verbose
flutter build ios --verbose
```

### Runtime Performance

```bash
# Launch with profiling
flutter run --profile

# Use DevTools for performance analysis
# http://localhost:9100 → Performance tab
```

### App Size Analysis

```bash
# Analyze APK size
flutter build apk --analyze-size --release

# Analyze dimensions
flutter build appbundle --analyze-size --release
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `No devices detected` | Emulator/device not running | Start emulator or connect device + enable debugging |
| `Gradle sync failed` | Gradle cache issues | `flutter clean && flutter pub get` |
| `CocoaPods error` | Dependency issues | `cd ios && pod install` |
| `Certificate required` | iOS signing issues | Configure in Xcode project settings |
| `Port already in use` | Port conflict | Change port: `flutter run --observatory-port=9102` |
| `Out of memory` | Large build | Increase heap: `flutter run -d emulator --debug` |

---

## IDE Setup

### Visual Studio Code

```bash
# Install Flutter extension
# Extensions → Search "Flutter" → Install

# Install Dart extension
# Extensions → Search "Dart" → Install

# Configure settings.json
# Add Flutter SDK path if not detected automatically
```

### Android Studio

```bash
# Install Flutter plugin
# Settings → Plugins → Marketplace → "Flutter" → Install

# Install Dart plugin (comes with Flutter)

# Configure SDK
# Settings → Languages & Frameworks → Flutter
# Set Flutter SDK path: /path/to/flutter
```

---

## Next Steps

After successfully running the app:

1. **Explore the code** in `/lib` directory
2. **Modify colors** in `/lib/core/theme/app_colors.dart`
3. **Add new screens** following the auth pattern
4. **Connect to backend** by implementing repository methods
5. **Test on real devices**
6. **Deploy to app stores**

---

## Additional Resources

- [Flutter Official Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [GoRouter Documentation](https://pub.dev/packages/go_router)
- [Material Design 3 Guidelines](https://m3.material.io)

---

## Support

If you encounter issues:

1. Check this guide for common solutions
2. Run `flutter doctor` to diagnose environment issues
3. Check [Flutter GitHub Issues](https://github.com/flutter/flutter/issues)
4. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/flutter)
5. Community: [Flutter Discord](https://discord.gg/rflutterdev)

---

**Happy Coding! 🚀**
