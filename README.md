# Escape - Premium Authentication Flutter App

A production-grade Flutter authentication application with a premium, minimalist UI design. This app showcases clean architecture principles, modern state management, and professional UI/UX implementation.

## Features 

✨ **Premium Design System**
- Soft minimal aesthetic with premium academic styling
- Custom color palette with gradient backgrounds
- Professional typography with Sora and Inter fonts
- Smooth animations and transitions
- Responsive design for all screen sizes

🔐 **Authentication Screens**
- Login screen with email/password validation
- Sign-up screen with password strength indicator  
- Form validation with real-time feedback
- Password visibility toggling
- Google Sign-In button (UI ready for integration)

🏗️ **Clean Architecture**
- Organized folder structure following best practices
- Separation of concerns (presentation, domain, data)
- Riverpod for state management
- GoRouter for navigation
- Reusable, modular widgets

📱 **Platform Support**
- Android (fully supported)
- iOS (fully supported)
- Responsive layouts for all screen sizes

---

## Project Structure

```
lib/
├── main.dart                          # App entry point
├── config/
│   └── router/
│       └── app_router.dart            # GoRouter configuration
├── core/
│   ├── theme/
│   │   ├── app_colors.dart            # Color palette
│   │   ├── app_spacing.dart           # Spacing constants
│   │   ├── app_typography.dart        # Typography system
│   │   └── app_theme.dart             # ThemeData configuration
│   ├── validators/
│   │   └── validators.dart            # Form validation logic
│   ├── constants/                     # App constants
│   └── utils/                         # Utility functions
└── features/
    └── auth/
        ├── presentation/
        │   ├── pages/
        │   │   ├── login_screen.dart   # Login UI
        │   │   └── sign_up_screen.dart # Sign-up UI
        │   ├── widgets/
        │   │   ├── custom_text_field.dart
        │   │   ├── buttons.dart        # Primary & Secondary buttons
        │   │   ├── auth_widgets.dart   # Auth-specific widgets
        │   │   └── index.dart          # Widget exports
        │   └── notifiers/
        │       └── auth_notifier.dart  # Riverpod state management
        ├── domain/
        │   ├── entities/               # Domain models
        │   └── repositories/           # Repository interfaces
        └── data/
            └── repositories/           # Repository implementations
```

---

## Getting Started

### Prerequisites

- **Flutter SDK**: Version 3.10.7 or higher ([Install Flutter](https://flutter.dev/docs/get-started/install))
- **Dart SDK**: Included with Flutter
- **Android Studio** or **Xcode** for mobile development
- **Android Emulator** or **iOS Simulator** for testing

### Installation

1. **Clone or navigate to the project**:
   ```bash
   cd c:\Escape\escape_app
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Fix any issues** (optional):
   ```bash
   flutter clean
   flutter pub get
   ```

---

## Running the App

### Option 1: Run on Android Emulator

1. **Start the Android Emulator**:
   - Open Android Studio
   - Go to "AVD Manager" (Device Manager)
   - Click the play button next to any virtual device
   
   OR use terminal:
   ```bash
   emulator -avd Pixel_4_API_31
   ```

2. **Run the app**:
   ```bash
   flutter run
   ```

### Option 2: Run on iOS Simulator

1. **Start the iOS Simulator** (Mac only):
   ```bash
   open -a Simulator
   ```

2. **Run the app**:
   ```bash
   flutter run
   ```

### Option 3: Run on Physical Device

1. **Connect your device** via USB cable

2. **Enable Developer Mode** (Android) or Trust the computer (iOS)

3. **Run the app**:
   ```bash
   flutter run
   ```

---

## Build for Production

### Android APK

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-app.apk`

### Android App Bundle (Google Play)

```bash
flutter build appbundle --release
```

Output: `build/app/outputs/app-release.aab`

### iOS App Bundle (App Store)

```bash
flutter build ios --release
```

Follow the signing and deployment process in Xcode.

---

## Design System

### Color Palette

| Name | Hex Code | Usage |
|------|----------|-------|
| Gradient Start | #FBE4D8 | Background gradient |
| Gradient End | #F3E8F0 | Background gradient |
| Primary | #2B124C | Main brand color |
| Secondary | #522B5B | Secondary actions |
| Accent | #854F6C | Highlights |
| Text Primary | #190019 | Body text |
| Text Secondary | #522B5B | Secondary text |
| Border | #E6D3CF | Borders & dividers |

### Typography

- **Headings**: Sora (SemiBold) - 20px to 32px
- **Body**: Inter (Regular) - 12px to 16px  
- **Buttons**: Sora (SemiBold) - 14px

### Spacing System

- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **xxl**: 24px
- **xxxl**: 32px

### Border Radius

- **Small**: 12px
- **Medium**: 16px
- **Large**: 20px
- **Cards**: 24px

---

## Features Explained

### Login Screen (`login_screen.dart`)

Components:
- Email text field with validation
- Password field with visibility toggle
- "Forgot Password?" link
- Primary "Login" button
- Google Sign-In button
- "Sign up" link for new users

Validation:
- Email format validation
- Password minimum 8 characters

### Sign Up Screen (`sign_up_screen.dart`)

Components:
- First Name & Last Name fields (dual column)
- Email field
- Password field with strength indicator
- Confirm Password field
- Password strength indicator with color-coded progress
- Primary "Create Account" button
- Google Sign-Up button
- "Sign in" link for existing users

Validation:
- All fields required
- Email format validation
- Password minimum 8 characters
- Password confirmation match
- Password strength calculation (visual feedback)

### State Management (Riverpod)

The app uses Riverpod for form state management:
- `loginFormProvider`: Manages login form state
- `signUpFormProvider`: Manages sign-up form state
- `passwordStrengthProvider`: Calculates password strength (0-4)

States are kept in memory and reset on navigation.

---

## Customization

### Changing Colors

Edit `/lib/core/theme/app_colors.dart`:
```dart
static const Color primary = Color(0xFF2B124C);
```

### Changing Typography

Edit `/lib/core/theme/app_typography.dart`:
```dart
static const TextStyle heading1 = TextStyle(
  fontFamily: 'Sora',
  fontSize: 32.0,
  fontWeight: FontWeight.w600,
);
```

### Modifying Spacing

Edit `/lib/core/theme/app_spacing.dart`:
```dart
static const double lg = 16.0;
```

### Updating Theme

Edit `/lib/core/theme/app_theme.dart` to modify the global `ThemeData`.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| flutter_riverpod | 2.4.0+ | State management |
| go_router | 13.0.0+ | Navigation & routing |
| email_validator | 2.1.17 | Email validation |
| google_sign_in | 6.1.6+ | Google authentication UI |

---

## Testing

### Run Static Analysis

```bash
flutter analyze
```

### Format Code

```bash
dart format lib/
```

### Check Code Style

```bash
flutter analyze --fatal-infos
```

---

## Troubleshooting

### "No supported devices connected"
- Start an Android Emulator or iOS Simulator
- Connect a physical device via USB
- Enable USB debugging (Android)

### Build fails with "Target of URI doesn't exist"
```bash
flutter clean
flutter pub get
flutter pub cache repair
```

### Plugin issues
```bash
flutter pub get
flutter pub upgrade
```

### Hot reload not working
- Try hot restart: `R` in terminal
- Or restart the app completely

---

## Architecture Overview

### Clean Architecture Layers

1. **Presentation Layer** (`presentation/`)
   - UI components (Screens & Widgets)
   - State management (Notifiers)
   - User interaction handling

2. **Domain Layer** (`domain/`)
   - Business logic rules
   - Entity definitions
   - Repository interfaces

3. **Data Layer** (`data/`)
   - Repository implementations
   - API/Database interactions
   - Data models

### State Management Flow

```
User Input → Widget → Riverpod Notifier → Form State → UI Update
```

---

## Next Steps

To extend this authentication system:

1. **Backend Integration**
   - Implement `AuthRepository` in `/data/repositories/`
   - Add API calls for login/sign-up
   - Handle JWT token storage

2. **Additional Features**
   - Password reset screen
   - Email verification
   - Social login (Google, Apple, Facebook)
   - Two-factor authentication

3. **Testing**
   - Add unit tests for validators
   - Add widget tests for screens
   - Add integration tests for flows

4. **Security**
   - Implement secure token storage
   - Add SSL pinning
   - Implement biometric authentication

---

## Best Practices Used

✅ Clean Architecture pattern
✅ SOLID principles
✅ Riverpod for reactive state management
✅ GoRouter for declarative navigation
✅ Custom theme with Material Design 3
✅ Form validation and error handling
✅ Responsive UI design
✅ Reusable component widgets
✅ Organized folder structure
✅ Type-safe imports

---

## Support & Questions

For issues or questions:
1. Check the Flutter documentation: https://flutter.dev/docs
2. Review Riverpod docs: https://riverpod.dev
3. Check GoRouter docs: https://pub.dev/packages/go_router

---

## License

This project is a demonstration of professional Flutter development practices.

---

**Built with ❤️ using Flutter**

Happy coding!
