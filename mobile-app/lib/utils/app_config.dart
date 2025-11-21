class AppConfig {
  // API Configuration
  // Note: Backend runs on port 8000
  // For web: use localhost:8000
  // For mobile: use your computer's IP address (e.g., http://192.168.1.100:8000)
  static const String baseUrl = 'http://localhost:8000';
  // For production, use your actual server URL
  // static const String baseUrl = 'https://api.yourcompany.com';
  
  // Alternative: Use your computer's IP for mobile device testing
  // Find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
  // static const String baseUrl = 'http://192.168.1.XXX:8000';
  
  // API Endpoints
  static const String loginEndpoint = '/employeelogin';
  static const String dashboardEndpoint = '/dashboard';
  static const String clockInEndpoint = '/workDetails/clockIn';
  static const String clockOutEndpoint = '/workDetails/clockOut';
  static const String leaveEndpoint = '/applyLeave';
  static const String timesheetEndpoint = '/getWorkDetails';
  static const String shiftEndpoint = '/shifts/assignments';
  static const String notificationEndpoint = '/notifications';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String offlineDataKey = 'offline_data';
  
  // App Settings
  static const int syncIntervalSeconds = 300; // 5 minutes
  static const int maxRetryAttempts = 3;
  static const Duration requestTimeout = Duration(seconds: 30);
  
  // Notification Settings
  static const String notificationChannelId = 'timesheet_notifications';
  static const String notificationChannelName = 'Time Sheet Notifications';
  static const String notificationChannelDescription = 'Notifications for time sheet management';
}

