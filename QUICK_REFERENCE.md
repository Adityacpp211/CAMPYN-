# 🚀 Quick Reference Card

## File Locations & Purposes

| Component | Location | Purpose |
|-----------|----------|---------|
| **Main Entry** | `lib/main.dart` | App initialization with Riverpod & GoRouter |
| **Router Config** | `config/router/app_router.dart` | Route definitions |
| **Colors** | `core/theme/app_colors.dart` | Color palette |
| **Spacing** | `core/theme/app_spacing.dart` | Spacing constants |
| **Typography** | `core/theme/app_typography.dart` | Text styles |
| **Theme** | `core/theme/app_theme.dart` | Global ThemeData |
| **Validators** | `core/validators/validators.dart` | Form validation logic |
| **Login Screen** | `features/auth/presentation/pages/login_screen.dart` | Login UI |
| **Sign-Up Screen** | `features/auth/presentation/pages/sign_up_screen.dart` | Sign-up UI |
| **Custom TextField** | `features/auth/presentation/widgets/custom_text_field.dart` | Reusable input |
| **Buttons** | `features/auth/presentation/widgets/buttons.dart` | Primary & Secondary buttons |
| **Auth Widgets** | `features/auth/presentation/widgets/auth_widgets.dart` | Specialized components |
| **State Management** | `features/auth/presentation/notifiers/auth_notifier.dart` | Riverpod providers |

---

## Common Tasks

### 🎨 Change App Colors

**File**: `lib/core/theme/app_colors.dart`

```dart
static const Color primary = Color(0xFF2B124C);  // Change this
```

### 📝 Update Typography

**File**: `lib/core/theme/app_typography.dart`

```dart
static const TextStyle heading1 = TextStyle(
  fontSize: 32.0,  // Modify size
  fontFamily: 'Sora',  // Change font
);
```

### 📏 Adjust Spacing

**File**: `lib/core/theme/app_spacing.dart`

```dart
static const double lg = 16.0;  // Modify spacing
```

### ✔️ Modify Validation Rules

**File**: `lib/core/validators/validators.dart`

```dart
static String? validateEmail(String? value) {
  // Add custom validation logic
}
```

### 📱 Add New Route

**File**: `lib/config/router/app_router.dart`

```dart
GoRoute(
  path: '/new-screen',
  name: 'newScreen',
  builder: (context, state) => NewScreen(),
),
```

### 🎯 Create New Widget

1. Create file in `lib/features/auth/presentation/widgets/`
2. Extend `StatefulWidget` or `StatelessWidget`
3. Export in `widgets/index.dart`
4. Use in screens

### 📊 Add State Management

**File**: `lib/features/auth/presentation/notifiers/auth_notifier.dart`

```dart
final myProvider = StateNotifierProvider<MyNotifier, MyState>((ref) {
  return MyNotifier();
});
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Hot Reload | `R` (in terminal) |
| Hot Restart | `R` (again in terminal) |
| Debug Paint Toggle | `P` |
| Help | `H` |
| Quit | `Q` |

---

## Build Commands

```bash
# Development
flutter run                              # Run on emulator/device
flutter run -v                          # Verbose mode
flutter run --profile                   # Profile mode

# Production Builds
flutter build apk --release             # Android APK
flutter build appbundle --release       # Android App Bundle
flutter build ios --release             # iOS build
flutter build ipa --release             # iOS for App Store

# Testing
flutter test                            # Run all tests
flutter analyze                         # Check code quality
dart format lib/                        # Format all code

# Maintenance
flutter clean                           # Clean build
flutter pub get                         # Install dependencies
flutter pub upgrade                     # Upgrade all packages
flutter doctor                          # Check setup
```

---

## Dependencies Overview

| Package | Version | Usage |
|---------|---------|-------|
| `flutter_riverpod` | 2.4.0+ | State management |
| `go_router` | 13.0.0+ | Navigation |
| `email_validator` | 2.1.17 | Email validation |
| `google_sign_in` | 6.1.6+ | Google auth UI |

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Email | Must be valid format |
| Password | Min 8 characters |
| Name | Min 2 characters, not empty |
| Confirm Password | Must match password field |
| Password Strength | 0-4 levels based on complexity |

---

## Screen Sizes Supported

| Category | Sizes | Devices |
|----------|-------|---------|
| Mobile | 320px - 480px | Phones |
| Tablet | 480px - 720px | Small tablets |
| Large Tablet | 720px+ | Large devices |

---

## API Integration (When Ready)

### Step 1: Create API Service
```dart
// lib/features/auth/data/services/auth_api_service.dart
class AuthApiService {
  Future<LoginResponse> login(String email, String password) async {
    // Make HTTP request
  }
}
```

### Step 2: Implement Repository
```dart
// lib/features/auth/data/repositories/auth_repository_impl.dart
class AuthRepositoryImpl implements AuthRepository {
  final AuthApiService apiService;
  
  @override
  Future<User> login(String email, String password) async {
    return await apiService.login(email, password);
  }
}
```

### Step 3: Use in State Management
```dart
// In auth_notifier.dart
void login(String email, String password) async {
  setLoading(true);
  try {
    final user = await repository.login(email, password);
    // Handle success
  } catch (e) {
    setError(e.toString());
  } finally {
    setLoading(false);
  }
}
```

---

## Troubleshooting Commands

```bash
# Can't find devices?
flutter devices
# OR start emulator manually

# Build issues?
flutter clean
flutter pub get
flutter pub cache repair

# Analyzer errors?
flutter analyze --no-pub
dart format lib/

# Firebase or plugin issues?
flutter pub get
flutter pub upgrade
flutter clean
flutter run

# Port already in use?
flutter run --observatory-port=9102

# Want more debug info?
flutter run -v

# Check Flutter installation?
flutter doctor
flutter doctor -v
```

---

## Performance Tips

### ✅ Best Practices

1. Use `const` constructors
2. Use `Provider` for computed values (password strength)
3. Avoid rebuilds with proper `watch` usage
4. Use `ConsumerWidget` for simple widgets
5. Separate UI from business logic

### ⚠️ Avoid

1. ❌ Building widgets outside build method
2. ❌ Complex computations in build
3. ❌ Direct state mutations
4. ❌ Synchronous network calls
5. ❌ Hardcoded strings (use constants)

---

## Code Style Guidelines

### Naming Conventions

```dart
// Classes: PascalCase
class LoginScreen { }

// Variables & functions: camelCase
var userName = 'John';
void validateEmail() { }

// Constants: camelCase
const int maxLength = 100;

// Private: _leadingUnderscore
class _PrivateWidget { }
var _internalState = '';
```

### File Naming

```
lib/
  features/
    feature_name/
      presentation/
        pages/
          feature_screen.dart   # Screen files
        widgets/
          custom_widget.dart    # Widget files
          index.dart            # Exports
```

---

## Testing Patterns

### Unit Test Example
```dart
test('validateEmail returns null for valid email', () {
  expect(
    Validators.validateEmail('test@example.com'),
    null,
  );
});
```

### Widget Test Example
```dart
testWidgets('LoginScreen shows email input', (WidgetTester tester) async {
  await tester.pumpWidget(MaterialApp(home: LoginScreen()));
  expect(find.byType(TextField), findsOneWidget);
});
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Overview & quick setup |
| `ARCHITECTURE.md` | Detailed architecture guide |
| `SETUP_GUIDE.md` | Step-by-step installation |
| `IMPLEMENTATION_SUMMARY.md` | What was built & why |
| `QuickReference.md` | This file - quick lookups |

---

## Useful Links

- [Flutter Docs](https://flutter.dev/docs)
- [Riverpod Docs](https://riverpod.dev)
- [GoRouter Docs](https://pub.dev/packages/go_router)
- [Material Design 3](https://m3.material.io)
- [Dart Documentation](https://dart.dev/guides)

---

## Git Workflow (Optional)

```bash
# Initialize git
git init

# Add files
git add .

# Initial commit
git commit -m "Initial Flutter auth app"

# Create branches for features
git checkout -b feature/password-reset
git commit -am "Add password reset"
git checkout main
git merge feature/password-reset
```

---

## Release Checklist

When ready to deploy:

- [ ] Update version in `pubspec.yaml`
- [ ] Run all tests: `flutter test`
- [ ] Check code quality: `flutter analyze`
- [ ] Format code: `dart format lib/`
- [ ] Build APK: `flutter build apk --release`
- [ ] Build App Bundle: `flutter build appbundle --release`
- [ ] Build iOS: `flutter build ios --release`
- [ ] Test on physical devices
- [ ] Update README with latest version
- [ ] Create git tag: `git tag v1.0.0`

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅

---

For detailed information, refer to the comprehensive documentation files in the project root.
