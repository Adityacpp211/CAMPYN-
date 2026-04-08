import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:escape_app/core/theme/app_colors.dart';
import 'package:escape_app/core/theme/app_spacing.dart';
import 'package:escape_app/core/theme/app_typography.dart';
import 'package:escape_app/core/theme/app_theme.dart';
import 'package:escape_app/core/validators/validators.dart';
import '../notifiers/auth_notifier.dart';
import '../widgets/index.dart';

class LoginScreen extends ConsumerStatefulWidget {
  final VoidCallback onNavigateToSignUp;

  const LoginScreen({Key? key, required this.onNavigateToSignUp})
    : super(key: key);

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  late TextEditingController _emailController;
  late TextEditingController _passwordController;
  bool _obscurePassword = true;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (_formKey.currentState?.validate() ?? false) {
      // Mark form as valid
      ref.read(loginFormProvider.notifier).validateForm();

      // Simulate login
      ref.read(loginFormProvider.notifier).setLoading(true);

      await Future.delayed(const Duration(seconds: 2));

      ref.read(loginFormProvider.notifier).setLoading(false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Login successful!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    }
  }

  void _handleGoogleSignIn() {
    // Google sign-in logic would go here
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Google Sign-In coming soon'),
        backgroundColor: AppColors.accent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(loginFormProvider);

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
                                'Welcome Back',
                                style: AppTypography.heading2.copyWith(
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                'Login to continue your journey',
                                style: AppTypography.body.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: AppSpacing.xxxl),

                          // Email field
                          CustomTextField(
                            label: 'Email',
                            hint: 'Enter your email address',
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            validator: Validators.validateEmail,
                            onChanged: (value) {
                              ref
                                  .read(loginFormProvider.notifier)
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
                            hint: 'Enter your password',
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            validator: Validators.validatePassword,
                            onChanged: (value) {
                              ref
                                  .read(loginFormProvider.notifier)
                                  .updatePassword(value);
                            },
                            textInputAction: TextInputAction.done,
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

                          const SizedBox(height: AppSpacing.sm),

                          // Forgot password
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {
                                // Navigate to forgot password
                              },
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: Text(
                                'Forgot password?',
                                style: AppTypography.bodySmall.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: AppSpacing.xxxl),

                          // Login button
                          PrimaryButton(
                            label: 'Login',
                            isLoading: authState.isLoading,
                            onPressed: _handleLogin,
                          ),

                          const SizedBox(height: AppSpacing.xl),

                          // Divider
                          const DividerWithText(text: 'OR'),

                          const SizedBox(height: AppSpacing.xl),

                          // Google sign-in
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
                            onPressed: _handleGoogleSignIn,
                          ),

                          const SizedBox(height: AppSpacing.xl),

                          // Sign up link
                          LoginLink(
                            text: "Don't have an account?",
                            linkText: 'Sign up',
                            onTap: widget.onNavigateToSignUp,
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
