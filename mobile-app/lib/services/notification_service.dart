// import 'package:firebase_messaging/firebase_messaging.dart'; // Uncomment when Firebase is configured
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_native_timezone/flutter_native_timezone.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:logger/logger.dart';

class NotificationService {
  /// Notification IDs: 1001 = clock-in reminder, 1002–1011 = shift reminders, 2000–2099 = challenge task reminders
  static const int _clockInReminderId = 1001;
  static const int _shiftReminderIdStart = 1002;
  static const int _shiftReminderIdEnd = 1011;
  static const int _challengeReminderIdStart = 2000;
  static const int _challengeReminderIdEnd = 2099;
  static const String _prefReminderEnabled = 'reminder_enabled';
  static const String _prefClockInReminderTime = 'clock_in_reminder_time'; // "HH:mm"
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static final Logger _logger = Logger();
  static bool _timezoneInitialized = false;
  // static FirebaseMessaging? _firebaseMessaging; // Uncomment when Firebase is configured
  
  static Future<void> init() async {
    // Initialize timezone for scheduled notifications (required for zonedSchedule)
    if (!_timezoneInitialized) {
      try {
        tz_data.initializeTimeZones();
        final String timezoneName = await FlutterNativeTimezone.getLocalTimezone();
        tz.setLocalLocation(tz.getLocation(timezoneName));
        _timezoneInitialized = true;
        _logger.i('Timezone initialized: $timezoneName');
      } catch (e) {
        _logger.w('Timezone init failed, scheduled reminders may be wrong: $e');
      }
    }
    
    // Initialize local notifications
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
    
    // Create notification channel for Android
    const androidChannel = AndroidNotificationChannel(
      AppConfig.notificationChannelId,
      AppConfig.notificationChannelName,
      description: AppConfig.notificationChannelDescription,
      importance: Importance.high,
    );
    
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
    
    // Permission request is done after first frame in main.dart so the system dialog shows (Android 13+)
    
    // Initialize Firebase Messaging (if using Firebase)
    // Uncomment when Firebase is configured
    /*
    _firebaseMessaging = FirebaseMessaging.instance;
    
    // Request permission
    NotificationSettings settings = await _firebaseMessaging!.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      _logger.i('User granted notification permission');
      
      // Get FCM token
      String? token = await _firebaseMessaging!.getToken();
      if (token != null) {
        await _saveFcmToken(token);
      }
      
      // Listen for token refresh
      _firebaseMessaging!.onTokenRefresh.listen((newToken) {
        _saveFcmToken(newToken);
      });
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      
      // Handle background messages
      FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);
    }
    */
    
    _logger.i('Notification service initialized');
  }
  
  static void _onNotificationTapped(NotificationResponse response) {
    _logger.d('Notification tapped: ${response.payload}');
    // Handle notification tap
  }

  /// Request notification + exact alarm permissions. Call from init or from UI (e.g. reminder settings).
  /// On Android 13+ this shows the notification permission dialog.
  /// Exact alarm has no system dialog; use [openAppSettingsForAlarms] if reminders don't fire when app is closed.
  static Future<void> requestReminderPermissions() async {
    if (kIsWeb || !Platform.isAndroid) return;
    try {
      // 1. Notification permission – shows system dialog on Android 13+
      final notifStatus = await Permission.notification.status;
      if (notifStatus.isDenied) {
        await Permission.notification.request();
      }
      // 2. Exact alarm – required for reminders when app is closed (Android 12+). No dialog; user may need to enable in Settings.
      final alarmStatus = await Permission.scheduleExactAlarm.status;
      if (alarmStatus.isDenied) {
        await Permission.scheduleExactAlarm.request();
      }
    } catch (e) {
      _logger.w('Request reminder permissions: $e');
    }
  }

  /// Opens app settings so user can enable "Alarms & reminders" (exact alarm). Call when reminders don't fire with app closed.
  static Future<bool> openAppSettingsForAlarms() async {
    try {
      return await openAppSettings();
    } catch (e) {
      _logger.w('Open app settings: $e');
      return false;
    }
  }

  /// Whether exact alarm permission is granted (reminders can fire when app is closed).
  static Future<bool> get hasExactAlarmPermission async {
    if (kIsWeb || !Platform.isAndroid) return true;
    try {
      final status = await Permission.scheduleExactAlarm.status;
      return status.isGranted;
    } catch (_) {
      return false;
    }
  }
  
  // Show local notification
  static Future<void> showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      AppConfig.notificationChannelId,
      AppConfig.notificationChannelName,
      channelDescription: AppConfig.notificationChannelDescription,
      importance: Importance.high,
      priority: Priority.high,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(
      id,
      title,
      body,
      details,
      payload: payload,
    );
  }
  
  // Schedule notification
  static Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      AppConfig.notificationChannelId,
      AppConfig.notificationChannelName,
      channelDescription: AppConfig.notificationChannelDescription,
      importance: Importance.high,
      priority: Priority.high,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    // For web, use simple show instead of zonedSchedule
    // For mobile platforms, use zonedSchedule
    try {
      await _localNotifications.zonedSchedule(
        id,
        title,
        body,
        _convertToTZDateTime(scheduledDate),
        details,
        payload: payload,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (e) {
      // Fallback for web or unsupported platforms
      _logger.w('Scheduled notifications not supported, showing immediately: $e');
      await showLocalNotification(
        id: id,
        title: title,
        body: body,
        payload: payload,
      );
    }
  }
  
  // Cancel notification
  static Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }
  
  // Cancel all notifications
  static Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }
  
  // Handle foreground message (Firebase) - Uncomment when Firebase is configured
  /*
  static void _handleForegroundMessage(RemoteMessage message) {
    _logger.d('Foreground message: ${message.messageId}');
    
    showLocalNotification(
      id: message.hashCode,
      title: message.notification?.title ?? 'New Notification',
      body: message.notification?.body ?? '',
      payload: message.data.toString(),
    );
  }
  
  // Handle background message (Firebase)
  static void _handleBackgroundMessage(RemoteMessage message) {
    _logger.d('Background message: ${message.messageId}');
    // Handle background message
  }
  */
  
  // Save FCM token
  static Future<void> _saveFcmToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fcm_token', token);
    _logger.i('FCM token saved: $token');
    // TODO: Send token to backend
  }
  
  // Convert DateTime to TZDateTime for zonedSchedule
  static tz.TZDateTime _convertToTZDateTime(DateTime dateTime) {
    return tz.TZDateTime.from(dateTime, tz.local);
  }
  
  // Schedule clock-in reminder
  static Future<void> scheduleClockInReminder(DateTime reminderTime) async {
    await scheduleNotification(
      id: _clockInReminderId,
      title: 'Clock In Reminder',
      body: 'Don\'t forget to clock in!',
      scheduledDate: reminderTime,
      payload: 'clock_in_reminder',
    );
    _logger.d('Clock-in reminder scheduled for $reminderTime');
  }
  
  // Schedule shift reminder (id 1002–1011 for multiple shifts)
  static Future<void> scheduleShiftReminder({
    required DateTime reminderTime,
    required String shiftName,
    int notificationId = _shiftReminderIdStart,
  }) async {
    if (notificationId < _shiftReminderIdStart || notificationId > _shiftReminderIdEnd) {
      _logger.w('Shift reminder id $notificationId out of range, using $_shiftReminderIdStart');
      notificationId = _shiftReminderIdStart;
    }
    await scheduleNotification(
      id: notificationId,
      title: 'Shift Reminder',
      body: 'Your $shiftName shift starts soon!',
      scheduledDate: reminderTime,
      payload: 'shift_reminder',
    );
    _logger.d('Shift reminder scheduled for $reminderTime: $shiftName');
  }
  
  /// Cancel all clock-in and shift reminders (call before rescheduling)
  static Future<void> cancelReminders() async {
    await cancelNotification(_clockInReminderId);
    for (int id = _shiftReminderIdStart; id <= _shiftReminderIdEnd; id++) {
      await cancelNotification(id);
    }
  }

  /// Cancel all challenge task reminders (call before rescheduling)
  static Future<void> cancelChallengeReminders() async {
    for (int id = _challengeReminderIdStart; id <= _challengeReminderIdEnd; id++) {
      await cancelNotification(id);
    }
  }

  /// Schedule challenge/task reminders at each challenge's reminder time for today.
  /// [challenges] list of maps with 'id', 'challenge_title' or 'title', 'reminder_time' (e.g. "09:00" or "09:00:00").
  static Future<void> scheduleChallengeTaskReminders(List<dynamic> challenges) async {
    try {
      await cancelChallengeReminders();
      if (challenges.isEmpty) return;
      final now = DateTime.now();
      int id = _challengeReminderIdStart;
      for (final c in challenges) {
        if (id > _challengeReminderIdEnd) break;
        final map = c is Map ? c as Map : null;
        if (map == null) continue;
        final reminderTimeStr = map['reminder_time']?.toString()?.trim();
        if (reminderTimeStr == null || reminderTimeStr.isEmpty) continue;
        final parts = reminderTimeStr.split(':');
        final hour = parts.isNotEmpty ? int.tryParse(parts[0]) ?? 0 : 0;
        final minute = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
        final scheduled = DateTime(now.year, now.month, now.day, hour, minute);
        if (scheduled.isBefore(now) || scheduled.isAtSameMomentAs(now)) continue;
        final title = map['challenge_title']?.toString() ?? map['title']?.toString() ?? 'Challenge';
        await scheduleNotification(
          id: id,
          title: 'Task reminder',
          body: '$title – time to complete today\'s task.',
          scheduledDate: scheduled,
          payload: 'challenge_reminder_${map['id']}',
        );
        _logger.d('Challenge reminder scheduled for $scheduled: $title');
        id++;
      }
    } catch (e) {
      _logger.w('scheduleChallengeTaskReminders failed: $e');
    }
  }
  
  /// Schedule clock-in and shift reminders. Call after login or when home loads.
  static Future<void> scheduleAllReminders({String? employeeId}) async {
    try {
      await cancelReminders();
      final prefs = await SharedPreferences.getInstance();
      final reminderEnabled = prefs.getBool(_prefReminderEnabled) ?? true;
      if (!reminderEnabled) {
        _logger.d('Reminders disabled, skipping');
        return;
      }
      final reminderTimeStr = prefs.getString(_prefClockInReminderTime) ?? '08:00';
      final parts = reminderTimeStr.split(':');
      final hour = parts.isNotEmpty ? int.tryParse(parts[0]) ?? 8 : 8;
      final minute = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
      
      final now = DateTime.now();
      var clockInReminder = DateTime(now.year, now.month, now.day, hour, minute);
      if (clockInReminder.isBefore(now) || clockInReminder.isAtSameMomentAs(now)) {
        clockInReminder = clockInReminder.add(const Duration(days: 1));
      }
      await scheduleClockInReminder(clockInReminder);
      
      if (employeeId == null || employeeId.isEmpty) return;
      final api = ApiService();
      final assignments = await api.getShiftAssignments(employeeId: employeeId);
      final reminderBeforeMinutes = 15;
      int id = _shiftReminderIdStart;
      final end = now.add(const Duration(days: 2));
      for (final a in assignments) {
        if (id > _shiftReminderIdEnd) break;
        final m = a is Map ? a as Map : null;
        if (m == null) continue;
        final shift = m['shift'] is Map ? m['shift'] as Map : m;
        final assignmentDateStr = m['assignmentDate']?.toString() ?? shift['assignmentDate']?.toString();
        final startTimeStr = shift['startTime']?.toString();
        if (assignmentDateStr == null || startTimeStr == null) continue;
        DateTime? assignmentDate;
        try {
          assignmentDate = DateTime.parse(assignmentDateStr.split(' ').first);
        } catch (_) {
          continue;
        }
        final startParts = startTimeStr.split(':');
        final sh = startParts.isNotEmpty ? int.tryParse(startParts[0]) ?? 9 : 9;
        final sm = startParts.length > 1 ? int.tryParse(startParts[1]) ?? 0 : 0;
        final shiftStart = DateTime(assignmentDate.year, assignmentDate.month, assignmentDate.day, sh, sm);
        if (shiftStart.isBefore(now)) continue;
        if (shiftStart.isAfter(end)) continue;
        final reminderAt = shiftStart.subtract(Duration(minutes: reminderBeforeMinutes));
        if (reminderAt.isBefore(now)) continue;
        final shiftName = shift['shiftName']?.toString() ?? shift['name']?.toString() ?? m['shiftName']?.toString() ?? 'Shift';
        await scheduleShiftReminder(reminderTime: reminderAt, shiftName: shiftName, notificationId: id);
        id++;
      }
    } catch (e) {
      _logger.w('scheduleAllReminders failed: $e');
    }
  }
  
  /// Set whether reminders are enabled (default true).
  static Future<void> setReminderEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefReminderEnabled, enabled);
  }
  
  /// Set clock-in reminder time, e.g. "08:00".
  static Future<void> setClockInReminderTime(String timeHHmm) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefClockInReminderTime, timeHHmm);
  }
}

