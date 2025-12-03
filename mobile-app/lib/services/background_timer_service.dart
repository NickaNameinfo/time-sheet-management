import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode, debugPrint;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
// import 'package:workmanager/workmanager.dart'; // Removed due to compatibility issues
import 'package:timesheet_mobile/services/api_service.dart';
// import 'package:timesheet_mobile/services/background_callback.dart'; // Removed

class BackgroundTimerService {
  static const String taskName = "checkInTimerTask";
  static const String uniqueTaskName = "checkInTimerUniqueTask";
  
  static Future<void> initialize() async {
    // Background timer service disabled - workmanager has compatibility issues
    // Timer will work when app is in foreground
    debugPrint('BackgroundTimerService: Initialization skipped (workmanager removed)');
  }

  static Future<void> startBackgroundTimer() async {
    // Background timer service disabled - workmanager has compatibility issues
    // Timer will work when app is in foreground via the in-app timer
    debugPrint('BackgroundTimerService: Background timer disabled (workmanager removed)');
    // Timer continues to work in foreground via EmployeeHomeScreen's _hoursUpdateTimer
  }

  static Future<void> stopBackgroundTimer() async {
    // Background timer service disabled - workmanager has compatibility issues
    debugPrint('BackgroundTimerService: Stop background timer (no-op, workmanager removed)');
  }

  static Future<void> updateWorkingHours() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isClockedIn = prefs.getBool('is_clocked_in') ?? false;
      final clockInTimeStr = prefs.getString('clock_in_time');
      final workDetailId = prefs.getString('work_detail_id');
      
      if (!isClockedIn || clockInTimeStr == null || workDetailId == null) {
        return;
      }

      final clockInTime = DateTime.parse(clockInTimeStr);
      final now = DateTime.now();
      final duration = now.difference(clockInTime);
      final hours = duration.inMinutes / 60.0;

      // Update work details with current hours
      final apiService = ApiService();
      await apiService.updateWorkDetails(
        int.parse(workDetailId),
        {'totalHours': hours.toStringAsFixed(2)},
      );

      // Save updated hours
      await prefs.setDouble('current_working_hours', hours);
    } catch (e) {
      // Silently fail - background tasks should not crash
      debugPrint('Background timer update error: $e');
    }
  }
}


