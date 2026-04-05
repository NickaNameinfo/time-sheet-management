class AppConfig {
  // API Configuration
  // Note: Backend runs on port 8000
  // For web: use localhost:8000
  // For mobile: use your computer's IP address (e.g., http://192.168.1.100:8000)
  static const String baseUrl = 'https://nicknameinfo.net/timesheet';
  // static const String baseUrl = 'http://localhost:10000';
  // For production, use your actual server URL
  // static const String baseUrl = 'https://api.yourcompany.com';
  
  // Alternative: Use your computer's IP for mobile device testing
  // Find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
  // static const String baseUrl = 'http://192.168.1.XXX:8000';
  
  // API Endpoints
  /// Company portal + platform admin (users / company_users / employee Admin)
  static const String adminLoginEndpoint = '/login';
  static const String loginEndpoint = '/employeelogin';
  static const String hrLoginEndpoint = '/hrLogin';
  static const String dashboardEndpoint = '/dashboard';
  static const String clockInEndpoint = '/project/workDetails/clockIn';
  static const String clockOutEndpoint = '/project/workDetails/clockOut';
  static const String leaveEndpoint = '/applyLeave';
  static const String timesheetEndpoint = '/getWorkDetails';
  static const String shiftEndpoint = '/shifts/assignments';
  static const String notificationEndpoint = '/notifications';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String offlineDataKey = 'offline_data';
  /// Set after first run so reinstall = fresh start (no restored session).
  static const String firstLaunchDoneKey = 'app_first_launch_done';

  // Challenge (My Self) API & Storage
  static const String challengeTokenKey = 'challenge_auth_token';
  static const String challengeUserKey = 'challenge_user_data';
  static const String challengeAuthSendOtp = '/challenge-auth/send-otp';
  static const String challengeAuthRegister = '/challenge-auth/register';
  static const String challengeAuthLogin = '/challenge-auth/login';
  static const String challengeAuthSendResetOtp = '/challenge-auth/send-reset-otp';
  static const String challengeAuthResetPassword = '/challenge-auth/reset-password';
  static const String challengeAuthChangePassword = '/challenge-auth/change-password';
  static const String challengeAuthAccessWithEmployee = '/challenge-auth/access-with-employee';
  static const String challengeDashboard = '/challenge/dashboard';
  static const String challengeList = '/challenge/list';
  static const String challengeReports = '/challenge/reports';
  static const String challengeSettings = '/challenge/settings';
  static const String challengeProfile = '/challenge/profile';

  // Investment (My Self) API
  static const String investmentKycStatus = '/investment/kyc/status';
  static const String investmentKycSubmit = '/investment/kyc/submit';
  static const String investmentKycDocuments = '/investment/kyc/documents';
  static const String investmentPlans = '/investment/plans';
  static const String investmentDashboard = '/investment/dashboard';
  static const String investmentCheckoutValidate = '/investment/checkout/validate';
  static const String investmentCheckoutCreateOrder = '/investment/checkout/create-order';
  static const String investmentPaymentSuccess = '/investment/payment/success';

  /// Razorpay key (public key for client). Same as RAZORPAY_KEY_ID on server.
  static const String razorpayKey = 'rzp_live_RgPc8rKEOZbHgf';
  static const String investmentList = '/investment/list';
  static const String investmentWithdrawPreview = '/investment/withdraw/preview';
  static const String investmentWithdraw = '/investment/withdraw';
  static const String investmentReports = '/investment/reports';
  static const String investmentNotifications = '/investment/notifications';
  static const String investmentReferralStats = '/investment/referral/stats';
  static const String investmentReferralHistory = '/investment/referral/history';

  // Admin Investment (main app token)
  static const String adminInvestmentKycList = '/admin/investment/kyc';
  static const String adminInvestmentKycStatus = '/admin/investment/kyc/status';

  // App Settings
  static const int syncIntervalSeconds = 300; // 5 minutes
  static const int maxRetryAttempts = 3;
  static const Duration requestTimeout = Duration(seconds: 30);

  /// Tenant `employee.id` (dashboard `employeeRecordId`) for API params — required when company JWT has no `id`.
  static String? employeeDbIdForApi(Map<String, dynamic>? user) {
    if (user == null) return null;
    final er = user['employeeRecordId'];
    if (er != null) {
      final s = er.toString().trim();
      if (s.isNotEmpty && s != 'null') return s;
    }
    final id = user['id']?.toString().trim();
    if (id != null && id.isNotEmpty && id != 'null') return id;
    final eid = user['employeeId']?.toString().trim();
    if (eid != null && eid.isNotEmpty && eid != 'null') return eid;
    final emp = user['EMPID']?.toString().trim();
    if (emp != null && emp.isNotEmpty && emp != 'null') return emp;
    return null;
  }

  static bool looksLikeEmail(String s) {
    final t = s.trim();
    if (t.isEmpty) return false;
    return t.contains('@');
  }

  /// Prefer real name over login email for UI labels.
  static String displayNameForUser(Map<String, dynamic>? user) {
    if (user == null) return 'Employee';
    String? pick(String? a) {
      final t = a?.trim() ?? '';
      return t.isEmpty ? null : t;
    }

    for (final k in ['employeeName', 'tlName', 'leadName', 'hrName']) {
      final v = pick(user[k]?.toString());
      if (v != null && !looksLikeEmail(v)) return v;
    }
    final en = pick(user['employeeName']?.toString());
    if (en != null) return en;
    final un = pick(user['userName']?.toString());
    if (un != null && !looksLikeEmail(un)) return un;
    return 'Employee';
  }

  /// Build absolute URL for employee profile photo (`public/images` on server).
  static String? employeePhotoUrlFromFilename(dynamic filename) {
    if (filename == null) return null;
    var s = filename.toString().trim();
    if (s.isEmpty || s == 'default-image-filename.jpg') return null;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('images/')) s = s.substring('images/'.length);
    if (s.startsWith('/images/')) s = s.substring('/images/'.length);
    if (s.startsWith('/')) s = s.substring(1);
    final base = baseUrl.replaceAll(RegExp(r'/$'), '');
    return '$base/images/$s';
  }
  
  // Notification Settings
  static const String notificationChannelId = 'timesheet_notifications';
  static const String notificationChannelName = 'Time Sheet Notifications';
  static const String notificationChannelDescription = 'Notifications for time sheet management';
}

