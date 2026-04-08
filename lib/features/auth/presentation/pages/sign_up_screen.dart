import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:escape_app/core/theme/app_colors.dart';
import 'package:escape_app/core/theme/app_spacing.dart';
import 'package:escape_app/core/theme/app_typography.dart';
import 'package:escape_app/core/theme/app_theme.dart';
import 'package:escape_app/core/validators/validators.dart';
import '../notifiers/auth_notifier.dart';
import '../widgets/index.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  final VoidCallback onNavigateToLogin;

  const SignUpScreen({Key? key, required this.onNavigateToLogin})
    : super(key: key);

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _passwordController;
  late TextEditingController _confirmPasswordController;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleSignUp() async {
    if (_formKey.currentState?.validate() ?? false) {
      // Mark form as valid
      ref.read(signUpFormProvider.notifier).validateForm();

      // Simulate sign up
      ref.read(signUpFormProvider.notifier).setLoading(true);

      await Future.delayed(const Duration(seconds: 2));

      ref.read(signUpFormProvider.notifier).setLoading(false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sign up successful!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    }
  }

  void _handleGoogleSignUp() {
    // Google sign-up logic would go here
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Google Sign-Up coming soon'),
        backgroundColor: AppColors.accent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(signUpFormProvider);
    final passwordStrength = ref.watch(passwordStrengthProvider);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenPaddingHorizontal,
                vertical: AppSpacing.screenPaddingVertical,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 500),
                  child: AuthCard(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Create an Account',
                                style: AppTypography.heading2.copyWith(
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                'Sign up to start your engineering journey',
                                style: AppTypography.body.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: AppSpacing.xxxl),

                          // First Name and Last Name (same row)
                          Row(
                            children: [
                              Expanded(
                                child: CustomTextField(
                                  label: 'First Name',
                                  hint: 'First name',
                                  controller: _firstNameController,
                                  validator: Validators.validateName,
                                  onChanged: (value) {
                                    ref
                                        .read(signUpFormProvider.notifier)
                                        .updateFirstName(value);
                                  },
                                  textInputAction: TextInputAction.next,
                                ),
                              ),
                              const SizedBox(width: AppSpacing.lg),
                              Expanded(
                                child: CustomTextField(
                                  label: 'Last Name',
                                  hint: 'Last name',
                                  controller: _lastNameController,
                                  validator: Validators.validateName,
                                  onChanged: (value) {
                                    ref
                                        .read(signUpFormProvider.notifier)
                                        .updateLastName(value);
                                  },
                                  textInputAction: TextInputAction.next,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: AppSpacing.xl),

                          // Email field
                          CustomTextField(
                            label: 'Email',
                            hint: 'Enter your email address',
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            validator: Validators.validateEmail,
                            onChanged: (value) {
                              ref
                                  .read(signUpFormProvider.notifier)
                                  .updateEmail(value);
                            },
                            textInputAction: TextInputAction.next,
                            prefixIcon: const Icon(
                              Icons.email_outlined,
                              color: AppColors.textSecondary,
                              size: 20,
                            ),
                          ),

                          const SizedBox(height: AppSpacing.xl),

                          // Password field
                          CustomTextField(
                            label: 'Password',
                            hint: 'Create a strong password',
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            validator: Validators.validatePassword,
                            onChanged: (value) {
                              ref
                                  .read(signUpFormProvider.notifier)
                                  .updatePassword(value);
                            },
                            textInputAction: TextInputAction.next,
                            prefixIcon: const Icon(
                              Icons.lock_outlined,
                              color: AppColors.textSecondary,
                              size: 20,
                            ),
                            suffixIcon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              color: AppColors.textSecondary,
                              size: 20,
                            ),
                            onSuffixIconTap: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),

                          const SizedBox(height: AppSpacing.lg),

                          // Password strength indicator
                          PasswordStrengthIndicator(strength: passwordStrength),

                          const SizedBox(height: AppSpacing.xl),

                          // Confirm Password field
                          CustomTextField(
                            label: 'Confirm Password',
                            hint: 'Re-enter your password',
                            controller: _confirmPasswordController,
                            obscureText: _obscureConfirmPassword,
                            validator: (value) =>
                                Validators.validateConfirmPassword(
                                  value,
                                  _passwordController.text,
                                ),
                            onChanged: (value) {
                              ref
                                  .read(signUpFormProvider.notifier)
                                  .updateConfirmPassword(value);
                            },
                            textInputAction: TextInputAction.done,
                            prefixIcon: const Icon(
                              Icons.lock_outlined,
                              color: AppColors.textSecondary,
                              size: 20,
                            ),
                            suffixIcon: Icon(
                              _obscureConfirmPassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              color: AppColors.textSecondary,
                              size: 20,
                            ),
                            onSuffixIconTap: () {
                              setState(() {
                                _obscureConfirmPassword =
                                    !_obscureConfirmPassword;
                              });
                            },
                          ),

                          const SizedBox(height: AppSpacing.xxxl),

                          // Sign up button
                          PrimaryButton(
                            label: 'Create Account',
                            isLoading: authState.isLoading,
                            onPressed: _handleSignUp,
                          ),

                          const SizedBox(height: AppSpacing.xl),

                          // Divider
                          const DividerWithText(text: 'OR'),

                          const SizedBox(height: AppSpacing.xl),

                          // Google sign-up
                          SocialButton(
                            label: 'Continue with Google',
                            icon: Container(
                              width: 20,
                              height: 20,
                              decoration: const BoxDecoration(
                                color: Color(0xFF4285F4),
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: Text(
                                  'G',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                            isLoading: false,
                            onPressed: _handleGoogleSignUp,
                          ),

                          const SizedBox(height: AppSpacing.xl),

                          // Login link
                          LoginLink(
                            text: 'Already have an account?',
                            linkText: 'Sign in',
                            onTap: widget.onNavigateToLogin,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
