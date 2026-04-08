import 'package:go_router/go_router.dart';
import 'package:escape_app/features/auth/presentation/pages/login_screen.dart';
import 'package:escape_app/features/auth/presentation/pages/sign_up_screen.dart';

class AppRouter {
  static const String loginRoute = '/login';
  static const String signUpRoute = '/signup';

  static final GoRouter router = GoRouter(
    initialLocation: loginRoute,
    debugLogDiagnostics: false,
    routes: [
      GoRoute(
        path: loginRoute,
        name: 'login',
        builder: (context, state) => LoginScreen(
          onNavigateToSignUp: () {
            context.goNamed('signup');
          },
        ),
      ),
      GoRoute(
        path: signUpRoute,
        name: 'signup',
        builder: (context, state) => SignUpScreen(
          onNavigateToLogin: () {
            context.goNamed('login');
          },
        ),
      ),
    ],
  );
}
