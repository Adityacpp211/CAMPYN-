# Architecture & Implementation Guide

This document provides an in-depth overview of the Escape authentication app's architecture and implementation details.

## Architecture Overview

Escape uses **Clean Architecture** with three distinct layers, following SOLID principles and best practices for scalable, maintainable code.

### Layer 1: Presentation Layer (`lib/features/auth/presentation/`)

**Responsibility**: Handle user interface and user interactions

#### Components:

**Pages** (`pages/`)
- `login_screen.dart`: Login UI with form fields and submission
- `sign_up_screen.dart`: Registration UI with multi-field form

**Widgets** (`widgets/`)
- `custom_text_field.dart`: Custom input field with validation and focus states
- `buttons.dart`: PrimaryButton and SecondaryButton with animations
- `auth_widgets.dart`: Specialized widgets (PasswordStrengthIndicator, DividerWithText, etc.)

**Notifiers** (`notifiers/`)
- `auth_notifier.dart`: Riverpod StateNotifiers for form state management

#### Key Features:
- Stateful components with lifecycle management
- Form validation with real-time feedback
- Focus node management for keyboard handling
- Animation controllers for button press effects and input focus glow

### Layer 2: Domain Layer (`lib/features/auth/domain/`)

**Responsibility**: Define business logic and contracts

#### Components:

**Entities** (`entities/`)
- Plain data classes representing core business objects
- No direct dependencies on external libraries

**Repositories** (`repositories/`)
- Abstract interfaces defining contracts for data operations
- Example: `AuthRepository` interface for login/signup operations

#### Key Principle:
The domain layer is completely independent and doesn't depend on the presentation or data layers. It defines what the app wants to do, not how it's done.

### Layer 3: Data Layer (`lib/features/auth/data/`)

**Responsibility**: Implement data fetching and storage

#### Components:

**Repositories** (`repositories/`)
- Concrete implementations of domain repository interfaces
- Handle API calls, local storage, and data transformation
- Convert between API models and domain entities

#### Key Principle:
All external dependencies (APIs, databases, local storage) are isolated here. The presentation layer never directly calls APIs—it goes through the data layer.

---

## State Management with Riverpod

Escape uses **Riverpod** for reactive state management, providing type-safe and dependency-injected providers.

### Form State Structure

```dart
// State class holding form data
class AuthFormState {
  final String email;
  final String password;
  final bool isLoading;
  final String? error;
  final bool isFormValid;
  
  AuthFormState copyWith({...}) // Immutable updates
}

// StateNotifier managing form updates
class LoginFormNotifier extends StateNotifier<AuthFormState> {
  void updateEmail(String email) { ... }
  void updatePassword(String password) { ... }
  bool validateForm() { ... }
}

// Provider exposing the notifier
final loginFormProvider = StateNotifierProvider((ref) => LoginFormNotifier());
```

### Provider Types Used

1. **StateNotifierProvider**: For mutable form state
   ```dart
   final loginFormProvider = StateNotifierProvider<LoginFormNotifier, AuthFormState>(...)
   ```

2. **Provider**: For computed values (password strength)
   ```dart
   final passwordStrengthProvider = Provider<int>((ref) {
     final signUpState = ref.watch(signUpFormProvider);
     // Calculate strength based on password
   })
   ```

### Usage in Widgets

```dart
class LoginScreen extends ConsumerStatefulWidget {
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(loginFormProvider);
    
    return CustomTextField(
      onChanged: (value) {
        ref.read(loginFormProvider.notifier).updateEmail(value);
      },
    );
  }
}
```

---

## Navigation with GoRouter

GoRouter provides declarative, type-safe routing with URL-based navigation.

### Router Configuration

```dart
// config/router/app_router.dart
class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => LoginScreen(
          onNavigateToSignUp: () => context.goNamed('signup'),
        ),
      ),
      GoRoute(
        path: '/signup',
        name: 'signup',
        builder: (context, state) => SignUpScreen(
          onNavigateToLogin: () => context.goNamed('login'),
        ),
      ),
    ],
  );
}
```

### Navigation Methods

**Named navigation** (recommended):
```dart
context.goNamed('signup');  // Push new route
context.go('/signup');      // Replace current route
```

**Parameters**:
```dart
goRoute(path: '/user/:id', ...)
context.go('/user/123');
```

---

## Theme System

Escape uses a centralized theme system with Material Design 3 support.

### Theme Files

1. **app_colors.dart**: Color constants with semantic naming
   ```dart
   static const Color primary = Color(0xFF2B124C);
   static const Color gradientStart = Color(0xFFFBE4D8);
   ```

2. **app_spacing.dart**: Spacing constants (4px to 48px)
   ```dart
   static const double lg = 16.0;
   static const double buttonHeight = 52.0;
   ```

3. **app_typography.dart**: Text styles using custom fonts
   ```dart
   static const TextStyle heading1 = TextStyle(
     fontFamily: 'Sora',
     fontSize: 32.0,
     fontWeight: FontWeight.w600,
   );
   ```

4. **app_theme.dart**: Global ThemeData configuration
   ```dart
   ThemeData get lightTheme {
     return ThemeData(
       useMaterial3: true,
       textTheme: TextTheme(...),
       inputDecorationTheme: InputDecorationTheme(...),
       elevatedButtonTheme: ElevatedButtonThemeData(...),
     );
   }
   ```

### Theme Usage

All widgets use theme values for consistency:
```dart
Text('Login', style: AppTypography.heading2.copyWith(
  color: AppColors.textPrimary,
))

Padding(
  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
  child: child,
)
```

---

## Validation System

Escape implements comprehensive form validation with multiple levels.

### Validator Functions

```dart
// core/validators/validators.dart
class Validators {
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) return 'Email is required';
    const emailRegex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
    return RegExp(emailRegex).hasMatch(value) ? null : 'Invalid email';
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Password required';
    return value.length < 8 ? 'Min 8 characters' : null;
  }
  
  static int calculatePasswordStrength(String password) {
    int strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (RegExp(r'[A-Z]').hasMatch(password)) strength++;
    if (RegExp(r'[0-9!@#$%^&*(),.?":{}|<>]').hasMatch(password)) strength++;
    return strength;
  }
}
```

### Form Validation Flow

**Step 1**: User input triggers `onChanged`
```dart
CustomTextField(
  onChanged: (value) {
    ref.read(loginFormProvider.notifier).updateEmail(value);
  },
)
```

**Step 2**: State updates
```dart
void updateEmail(String email) {
  state = state.copyWith(email: email);
}
```

**Step 3**: Form submission validation
```dart
bool validateForm() {
  final isEmailValid = state.email.contains('@');
  final isPasswordValid = state.password.length >= 8;
  
  final isValid = isEmailValid && isPasswordValid;
  state = state.copyWith(isFormValid: isValid);
  return isValid;
}
```

**Step 4**: Error display
```dart
CustomTextField(
  validator: Validators.validateEmail,
)
```

---

## Custom Widget Implementation

### CustomTextField

```dart
class CustomTextField extends StatefulWidget {
  final String label;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final Function(String)? onChanged;
  
  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  late FocusNode _focusNode;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Text(widget.label, style: AppTypography.bodyBold),
        
        // TextField with custom styling
        TextFormField(
          controller: widget.controller,
          focusNode: _focusNode,
          validator: widget.validator,
          onChanged: widget.onChanged,
          decoration: InputDecoration(
            border: OutlineInputBorder(...),
            focusedBorder: OutlineInputBorder(...),
            filled: true,
            fillColor: AppColors.surfaceBackground,
          ),
        ),
      ],
    );
  }
}
```

### PrimaryButton with Animation

```dart
class PrimaryButton extends StatefulWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;
  
  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> 
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  
  void _handleTapDown(TapDownDetails details) {
    _animationController.forward();
  }
  
  void _handleTapUp(TapUpDetails details) {
    _animationController.reverse();
    widget.onPressed();
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: ElevatedButton(...),
      ),
    );
  }
}
```

---

## Data Flow Example: Login

### User Flow

```
User Input Email
       ↓
CustomTextField.onChanged
       ↓
ref.read(loginFormProvider.notifier).updateEmail(email)
       ↓
StateNotifier updates state
       ↓
Riverpod notifies listeners
       ↓
Widget rebuilds with new state
       ↓
User clicks Login button
       ↓
validateForm() called
       ↓
If valid: Show loading, simulate API call
       ↓
Clear loading, show success message
```

### Code Example

```dart
// 1. User types email
CustomTextField(
  controller: _emailController,
  onChanged: (value) {
    ref.read(loginFormProvider.notifier).updateEmail(value);
  },
)

// 2. State updates
void updateEmail(String email) {
  state = state.copyWith(email: email);
}

// 3. Form watches state
Widget build(BuildContext context) {
  final authState = ref.watch(loginFormProvider);
  // authState.email now has new value
}

// 4. Submit
void _handleLogin() {
  if (_formKey.currentState?.validate() ?? false) {
    ref.read(loginFormProvider.notifier).setLoading(true);
    // Simulate API call
    await Future.delayed(Duration(seconds: 2));
    ref.read(loginFormProvider.notifier).setLoading(false);
  }
}
```

---

## Best Practices Implemented

### 1. Immutability
```dart
// ✅ Good: Copy with for immutable updates
state = state.copyWith(email: email);

// ❌ Bad: Direct mutation
state.email = email;
```

### 2. Type Safety
```dart
// ✅ Good: Type-safe providers
final userProvider = Provider<User>((ref) { ... });

// ❌ Bad: Dynamic/untyped
final userProvider = Provider((ref) => dynamic);
```

### 3. Separation of Concerns
```dart
// ✅ Good: Theme in separate file
import 'package:escape_app/core/theme/app_theme.dart';

// ❌ Bad: Theme defined in widgets
colors = {primary: Color(0xFF2B124C), ...};
```

### 4. DRY Principle
```dart
// ✅ Good: Reusable CustomTextField widget
CustomTextField(label: 'Email', ...)

// ❌ Bad: Duplicated TextField in every screen
TextField(...), TextField(...), TextField(...)
```

### 5. Error Handling
```dart
// ✅ Good: Validation before submission
if (formKey.currentState?.validate() ?? false) {
  // Submit
}

// ❌ Bad: No validation
controller.text.isEmpty ? ... : ...
```

---

## Testing Strategy

### Unit Tests (Validators)
```dart
test('validateEmail returns null for valid email', () {
  expect(Validators.validateEmail('test@example.com'), null);
  expect(Validators.validateEmail('invalid'), isNotNull);
});
```

### Widget Tests (CustomTextField)
```dart
testWidgets('CustomTextField displays label', (WidgetTester tester) async {
  await tester.pumpWidget(CustomTextField(label: 'Email'));
  expect(find.text('Email'), findsOneWidget);
});
```

### Integration Tests (Complete Flow)
```dart
testWidgets('Login flow', (WidgetTester tester) async {
  await tester.pumpWidget(MyApp());
  
  await tester.enterText(find.byType(TextField).first, 'test@example.com');
  await tester.tap(find.byType(ElevatedButton));
  await tester.pumpAndSettle();
  
  expect(find.text('Success'), findsOneWidget);
});
```

---

## Performance Optimization

### 1. Riverpod Caching
Providers are cached by default and only rebuild when dependencies change:
```dart
final passwordStrengthProvider = Provider<int>((ref) {
  final signUpState = ref.watch(signUpFormProvider);
  // Recalculation only when signUpFormProvider changes
})
```

### 2. Widget Rebuild Optimization
Use `ConsumerStatelessWidget` for simpler widgets:
```dart
class EmailDisplayWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(loginFormProvider);
    return Text(authState.email);
  }
}
```

### 3. Const Constructors
All widgets use const constructors where possible:
```dart
const CustomTextField(...)  // Prevents unnecessary rebuilds
```

---

## Extending the App

### Adding a New Screen

1. **Create the page** in `presentation/pages/`
2. **Add state management** in `presentation/notifiers/` if needed
3. **Create custom widgets** in `presentation/widgets/`
4. **Add route** in `config/router/app_router.dart`

### Adding Backend Integration

1. **Create API service** in `data/`
2. **Implement repository** in `data/repositories/`
3. **Update notifier** to call repository
4. **Handle errors** and show users

### Adding Authentication State

```dart
// Create auth provider
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>(...);

// Use in app
final authState = ref.watch(authStateProvider);
if (authState.isLoggedIn) {
  // Show home screen
} else {
  // Show login screen
}
```

---

## Common Patterns

### Async Operation with Loading State
```dart
void submitForm() async {
  ref.read(loginFormProvider.notifier).setLoading(true);
  
  try {
    await apiService.login(...);
    // Navigate to next screen
  } catch (e) {
    ref.read(loginFormProvider.notifier).setError(e.toString());
  } finally {
    ref.read(loginFormProvider.notifier).setLoading(false);
  }
}
```

### Computed Values
```dart
final emailValidityProvider = Provider<bool>((ref) {
  final email = ref.watch(loginFormProvider).email;
  return email.contains('@');
});
```

### Dependency Injection
```dart
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService('https://api.example.com');
});
```

---

This architecture ensures the app is scalable, testable, and maintainable while following Flutter best practices.
