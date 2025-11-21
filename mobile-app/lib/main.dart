import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
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
import 'package:timesheet_mobile/services/notification_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:timesheet_mobile/screens/splash_screen.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:logger/logger.dart';

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
  
  runApp(const MyApp());
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
      ],
      child: MaterialApp(
        title: 'Time Sheet Management',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF6366F1), // Modern indigo
            brightness: Brightness.light,
            primary: const Color(0xFF6366F1),
            secondary: const Color(0xFF8B5CF6),
            surface: Colors.white,
            background: const Color(0xFFF8FAFC),
          ),
          scaffoldBackgroundColor: const Color(0xFFF8FAFC),
          appBarTheme: AppBarTheme(
            elevation: 0,
            centerTitle: true,
            backgroundColor: const Color(0xFF6366F1),
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
              borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
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
              backgroundColor: const Color(0xFF6366F1),
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
            selectedItemColor: const Color(0xFF6366F1),
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

