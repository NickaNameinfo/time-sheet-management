import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;
import 'package:flutter/services.dart';
// import 'package:firebase_core/firebase_core.dart'; // Uncomment when Firebase is configured
// import 'package:hive_flutter/hive_flutter.dart'; // Only needed for mobile platforms
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/attendance_provider.dart';
import 'package:timesheet_mobile/providers/leave_provider.dart';
import 'package:timesheet_mobile/providers/timesheet_provider.dart';
import 'package:timesheet_mobile/providers/shift_provider.dart';
import 'package:timesheet_mobile/providers/notification_provider.dart';
import 'package:timesheet_mobile/providers/offline_provider.dart';
import 'package:timesheet_mobile/providers/challenge_auth_provider.dart';
import 'package:timesheet_mobile/services/notification_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:timesheet_mobile/services/background_timer_service.dart';
import 'package:timesheet_mobile/screens/splash_screen.dart';
import 'package:timesheet_mobile/theme/app_brand_colors.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_login_screen.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:logger/logger.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final logger = Logger();
  
  try {
    // Initialize Hive for local storage (skip on web)
    // Hive is not needed for web - we use SharedPreferences instead
    if (!kIsWeb) {
      try {
        // Uncomment when Hive is needed
        // await Hive.initFlutter();
        logger.i('Hive initialization skipped (not needed for basic functionality)');
      } catch (e) {
        logger.w('Hive initialization failed: $e');
      }
    } else {
      logger.i('Skipping Hive initialization on web');
    }
    
    // Initialize Firebase (if using Firebase for push notifications)
    // await Firebase.initializeApp();
    
    // Initialize offline service (with web support)
    try {
      await OfflineService.init();
      logger.i('OfflineService initialized');
    } catch (e) {
      logger.w('OfflineService initialization failed: $e');
    }
    
    // Initialize notification service
    try {
      await NotificationService.init();
      logger.i('NotificationService initialized');
    } catch (e) {
      logger.w('NotificationService initialization failed: $e');
    }
    
    // Initialize background timer service (skip on web)
    if (!kIsWeb) {
      try {
        await BackgroundTimerService.initialize();
        logger.i('BackgroundTimerService initialized');
        // Check if user is clocked in and start background timer
        await BackgroundTimerService.startBackgroundTimer();
      } catch (e) {
        logger.w('BackgroundTimerService initialization failed: $e');
      }
    }
    
    // Set preferred orientations (skip on web)
    if (!kIsWeb) {
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);
    }
  } catch (e) {
    logger.e('Initialization error: $e');
    // Continue anyway - app should still work
  }

  // When Challenge API returns 401, clear session and redirect to Challenge login with popup
  ChallengeApiService.onSessionExpired = () {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final context = navigatorKey.currentContext;
      if (context == null) return;
      await context.read<ChallengeAuthProvider>().logout();
      if (!context.mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text('Session expired'),
          content: const Text(
            'You have been logged out. Please log in again to continue.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                if (!context.mounted) return;
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const ChallengeLoginScreen()),
                  (route) => false,
                );
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    });
  };

  runApp(const MyApp());
  // Ask for notification + alarm permission after first frame so the system dialog actually shows (Android 13+)
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    if (kIsWeb || !Platform.isAndroid) return;
    await Future.delayed(const Duration(milliseconds: 800));
    await NotificationService.requestReminderPermissions();
  });
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AttendanceProvider()),
        ChangeNotifierProvider(create: (_) => LeaveProvider()),
        ChangeNotifierProvider(create: (_) => TimesheetProvider()),
        ChangeNotifierProvider(create: (_) => ShiftProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => OfflineProvider()),
        ChangeNotifierProvider(create: (_) => ChallengeAuthProvider()),
      ],
      child: MaterialApp(
        navigatorKey: navigatorKey,
        title: 'My Self Management',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.light(
            primary: AppBrandColors.blue,
            onPrimary: Colors.white,
            primaryContainer: Color(0xFFDCE8FF),
            onPrimaryContainer: Color(0xFF0D2D66),
            secondary: AppBrandColors.green,
            onSecondary: Colors.white,
            secondaryContainer: Color(0xFFD4F0D6),
            onSecondaryContainer: Color(0xFF1B4332),
            tertiary: AppBrandColors.amber,
            onTertiary: Color(0xFF3D3000),
            tertiaryContainer: Color(0xFFFFF3CD),
            onTertiaryContainer: Color(0xFF5C4A00),
            surface: Colors.white,
            onSurface: Color(0xFF1E293B),
            surfaceContainerHighest: Color(0xFFF8FAFC),
            error: Color(0xFFB3261E),
            onError: Colors.white,
          ),
          scaffoldBackgroundColor: const Color(0xFFF8FAFC),
          appBarTheme: AppBarTheme(
            elevation: 0,
            centerTitle: true,
            backgroundColor: AppBrandColors.blue,
            foregroundColor: Colors.white,
            titleTextStyle: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
            iconTheme: const IconThemeData(color: Colors.white),
          ),
          cardTheme: CardThemeData(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            color: Colors.white,
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppBrandColors.blue, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red, width: 1),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              backgroundColor: AppBrandColors.blue,
              foregroundColor: Colors.white,
              textStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          textTheme: const TextTheme(
            displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
            titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            bodyLarge: TextStyle(fontSize: 16),
            bodyMedium: TextStyle(fontSize: 14),
          ),
          bottomNavigationBarTheme: BottomNavigationBarThemeData(
            backgroundColor: Colors.white,
            selectedItemColor: AppBrandColors.blue,
            unselectedItemColor: Colors.grey.shade600,
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
            type: BottomNavigationBarType.fixed,
            elevation: 8,
          ),
        ),
        home: const SplashScreen(),
      ),
    );
  }
}

