import 'package:flutter_riverpod/flutter_riverpod.dart';

// Auth form state
class AuthFormState {
  final String email;
  final String password;
  final String? firstName;
  final String? lastName;
  final String? confirmPassword;
  final bool isLoading;
  final String? error;
  final bool isFormValid;

  const AuthFormState({
    this.email = '',
    this.password = '',
    this.firstName,
    this.lastName,
    this.confirmPassword,
    this.isLoading = false,
    this.error,
    this.isFormValid = false,
  });

  AuthFormState copyWith({
    String? email,
    String? password,
    String? firstName,
    String? lastName,
    String? confirmPassword,
    bool? isLoading,
    String? error,
    bool? isFormValid,
  }) {
    return AuthFormState(
      email: email ?? this.email,
      password: password ?? this.password,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      confirmPassword: confirmPassword ?? this.confirmPassword,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      isFormValid: isFormValid ?? this.isFormValid,
    );
  }
}

// Login form notifier
class LoginFormNotifier extends StateNotifier<AuthFormState> {
  LoginFormNotifier() : super(const AuthFormState());

  void updateEmail(String email) {
    state = state.copyWith(email: email);
  }

  void updatePassword(String password) {
    state = state.copyWith(password: password);
  }

  void setLoading(bool isLoading) {
    state = state.copyWith(isLoading: isLoading);
  }

  void setError(String? error) {
    state = state.copyWith(error: error);
  }

  void reset() {
    state = const AuthFormState();
  }

  bool validateForm() {
    final isEmailValid = state.email.isNotEmpty && state.email.contains('@');
    final isPasswordValid =
        state.password.isNotEmpty && state.password.length >= 8;

    final isValid = isEmailValid && isPasswordValid;
    state = state.copyWith(isFormValid: isValid);

    return isValid;
  }
}

// Sign Up form notifier
class SignUpFormNotifier extends StateNotifier<AuthFormState> {
  SignUpFormNotifier() : super(const AuthFormState());

  void updateFirstName(String firstName) {
    state = state.copyWith(firstName: firstName);
  }

  void updateLastName(String lastName) {
    state = state.copyWith(lastName: lastName);
  }

  void updateEmail(String email) {
    state = state.copyWith(email: email);
  }

  void updatePassword(String password) {
    state = state.copyWith(password: password);
  }

  void updateConfirmPassword(String confirmPassword) {
    state = state.copyWith(confirmPassword: confirmPassword);
  }

  void setLoading(bool isLoading) {
    state = state.copyWith(isLoading: isLoading);
  }

  void setError(String? error) {
    state = state.copyWith(error: error);
  }

  void reset() {
    state = const AuthFormState();
  }

  bool validateForm() {
    final isFirstNameValid = state.firstName?.isNotEmpty ?? false;
    final isLastNameValid = state.lastName?.isNotEmpty ?? false;
    final isEmailValid = state.email.isNotEmpty && state.email.contains('@');
    final isPasswordValid =
        state.password.isNotEmpty && state.password.length >= 8;
    final isConfirmPasswordValid = state.confirmPassword == state.password;

    final isValid =
        isFirstNameValid &&
        isLastNameValid &&
        isEmailValid &&
        isPasswordValid &&
        isConfirmPasswordValid;

    state = state.copyWith(isFormValid: isValid);

    return isValid;
  }

  int getPasswordStrength() {
    final password = state.password;
    if (password.isEmpty) return 0;

    int strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (RegExp(r'[A-Z]').hasMatch(password)) strength++;
    if (RegExp(r'[0-9!@#$%^&*(),.?":{}|<>]').hasMatch(password)) strength++;

    return strength;
  }
}

// Riverpod providers
final loginFormProvider =
    StateNotifierProvider<LoginFormNotifier, AuthFormState>(
      (ref) => LoginFormNotifier(),
    );

final signUpFormProvider =
    StateNotifierProvider<SignUpFormNotifier, AuthFormState>(
      (ref) => SignUpFormNotifier(),
    );

// Password strength provider
final passwordStrengthProvider = Provider<int>((ref) {
  final signUpState = ref.watch(signUpFormProvider);
  final password = signUpState.password;

  if (password.isEmpty) return 0;

  int strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (RegExp(r'[A-Z]').hasMatch(password)) strength++;
  if (RegExp(r'[0-9!@#$%^&*(),.?":{}|<>]').hasMatch(password)) strength++;

  return strength;
});
