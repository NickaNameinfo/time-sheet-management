// import 'package:firebase_messaging/firebase_messaging.dart'; // Uncomment when Firebase is configured
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:logger/logger.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static final Logger _logger = Logger();
  // static FirebaseMessaging? _firebaseMessaging; // Uncomment when Firebase is configured
  
  static Future<void> init() async {
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
  
  // Convert DateTime to TZDateTime (simplified - use timezone package for production)
  static dynamic _convertToTZDateTime(DateTime dateTime) {
    // For production, use timezone package
    return dateTime;
  }
  
  // Schedule clock-in reminder
  static Future<void> scheduleClockInReminder(DateTime reminderTime) async {
    await scheduleNotification(
      id: 1001,
      title: 'Clock In Reminder',
      body: 'Don\'t forget to clock in!',
      scheduledDate: reminderTime,
      payload: 'clock_in_reminder',
    );
  }
  
  // Schedule shift reminder
  static Future<void> scheduleShiftReminder({
    required DateTime reminderTime,
    required String shiftName,
  }) async {
    await scheduleNotification(
      id: 1002,
      title: 'Shift Reminder',
      body: 'Your $shiftName shift starts soon!',
      scheduledDate: reminderTime,
      payload: 'shift_reminder',
    );
  }
}

