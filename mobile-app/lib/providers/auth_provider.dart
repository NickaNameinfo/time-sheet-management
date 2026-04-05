import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/background_timer_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:logger/logger.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();

  bool _isLoading = false;
  bool _isAuthenticated = false;
  Map<String, dynamic>? _user;
  String? _error;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;

  AuthProvider() {
    // No existing-session check on startup (removed for fresh install behavior)
  }

  /// Call this when you need to restore session from storage (e.g. after login flow supports "remember me").
  Future<void> restoreSessionIfSaved() async {
    await _checkAuthStatus();
  }

  /// Refreshes name, photo, and company fields from [POST /dashboard] (e.g. after app start or pull-to-refresh).
  Future<void> refreshUserFromApi() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConfig.tokenKey);
    if (token == null || token.isEmpty) return;
    try {
      final dashboardResult = await _apiService.getDashboard(token);
      final raw = dashboardResult['Result'] ?? dashboardResult;
      if (raw == null || raw is! Map || raw.isEmpty) return;
      final apiResponse = Map<String, dynamic>.from(raw);
      final userData = userFromDashboard(
        apiResponse: apiResponse,
        loginResult: _user,
        token: token,
        fallbackUserName: _user?['userName']?.toString() ?? '',
      );
      await prefs.setString(AppConfig.userKey, jsonEncode(userData));
      _user = userData;
      notifyListeners();
    } catch (e) {
      _logger.e('refreshUserFromApi: $e');
    }
  }

  static String? _pickToken(Map<String, dynamic>? r) {
    if (r == null) return null;
    final t = r['token'] ?? r['tokensss'];
    if (t == null) return null;
    return t.toString();
  }

  static Map<String, dynamic> userFromDashboard({
    required Map<String, dynamic> apiResponse,
    Map<String, dynamic>? loginResult,
    required String token,
    required String fallbackUserName,
  }) {
    final isCompany = apiResponse['isCompanyUser'] == true;
    return {
      'id': apiResponse['id'] ?? loginResult?['id'],
      'employeeRecordId': apiResponse['employeeRecordId'] ?? apiResponse['id'] ?? loginResult?['id'],
      'userName': apiResponse['userName'] ?? loginResult?['userName'] ?? fallbackUserName,
      'employeeName': apiResponse['employeeName'] ??
          loginResult?['tlName'] ??
          loginResult?['leadName'] ??
          loginResult?['hrName'],
      'employeeImage': apiResponse['employeeImage'],
      'employeeId': apiResponse['employeeId'] ?? apiResponse['EMPID'] ?? loginResult?['id'],
      'EMPID': apiResponse['EMPID'] ?? apiResponse['employeeId'] ?? loginResult?['id'],
      'role': apiResponse['role'] ?? loginResult?['role'],
      'tlName': apiResponse['tlName'] ?? loginResult?['tlName'] ?? loginResult?['leadName'],
      'leadName': loginResult?['leadName'] ?? loginResult?['tlName'],
      'hrName': apiResponse['hrName'] ?? loginResult?['hrName'],
      'isCompanyUser': isCompany,
      'company_id': apiResponse['company_id'],
      'company_user_id': apiResponse['company_user_id'],
      'company_role': apiResponse['company_role'],
      'company_menu_role': apiResponse['company_menu_role'],
      'employee_table_role': apiResponse['employee_table_role'],
      'company_name': apiResponse['company_name'],
      'company_code': apiResponse['company_code'],
      'token': token,
    };
  }

  Future<void> _checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConfig.tokenKey);

    if (token != null) {
      _isAuthenticated = true;
      final userDataString = prefs.getString(AppConfig.userKey);
      if (userDataString != null) {
        try {
          _user = Map<String, dynamic>.from(jsonDecode(userDataString));
        } catch (e) {
          _logger.e('Error parsing user data: $e');
          try {
            final dashboardResult = await _apiService.getDashboard(token);
            final apiResponse = dashboardResult['Result'] ?? dashboardResult;
            if (apiResponse != null && apiResponse is Map) {
              _user = userFromDashboard(
                apiResponse: Map<String, dynamic>.from(apiResponse),
                loginResult: null,
                token: token,
                fallbackUserName: '',
              );
              await prefs.setString(AppConfig.userKey, jsonEncode(_user));
            }
          } catch (refreshError) {
            _logger.e('Error refreshing user data: $refreshError');
          }
        }
      }
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> _tryLogin(Future<Map<String, dynamic>> Function() fn) async {
    try {
      return await fn();
    } catch (e) {
      _logger.d('Login attempt skipped: $e');
      return null;
    }
  }

  /// Same cascade as web [Login.jsx]: admin (company + platform) → HR → Team Lead → Employee.
  Future<bool> login(String userName, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      Map<String, dynamic>? loginResult = await _tryLogin(() => _apiService.adminLogin(userName, password));
      loginResult ??= await _tryLogin(() => _apiService.hrLogin(userName, password));
      loginResult ??= await _tryLogin(() => _apiService.teamLeadLogin(userName, password));
      loginResult ??= await _tryLogin(() => _apiService.employeeLogin(userName, password));

      final token = _pickToken(loginResult);
      if (token == null) {
        _error = 'Invalid email/username or password';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConfig.tokenKey, token);

      try {
        final dashboardResult = await _apiService.getDashboard(token);
        final raw = dashboardResult['Result'] ?? dashboardResult;
        if (raw != null && raw is Map && raw.isNotEmpty) {
          final apiResponse = Map<String, dynamic>.from(raw);
          final userData = userFromDashboard(
            apiResponse: apiResponse,
            loginResult: loginResult,
            token: token,
            fallbackUserName: userName,
          );
          await prefs.setString(AppConfig.userKey, jsonEncode(userData));
          _user = userData;
          _isAuthenticated = true;
          _isLoading = false;
          notifyListeners();
          return true;
        }
        _error = 'Failed to fetch user details';
        _isLoading = false;
        notifyListeners();
        return false;
      } catch (e) {
        _logger.e('Error fetching dashboard: $e');
        final userData = {
          'userName': userName,
          'token': token,
        };
        await prefs.setString(AppConfig.userKey, jsonEncode(userData));
        _user = userData;
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      String errorMsg = e.toString().replaceAll('Exception: ', '');
      if (errorMsg.contains('Connection error') || errorMsg.contains('Cannot connect')) {
        _error = 'Cannot connect to server. Check API URL in app_config.dart and that the backend is running.';
      } else {
        _error = errorMsg;
      }
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.logout();
    } catch (e) {
      _logger.e('Logout API error: $e');
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.tokenKey);
    await prefs.remove(AppConfig.userKey);

    await prefs.remove('clock_in_time');
    await prefs.remove('work_detail_id');
    await prefs.remove('is_clocked_in');
    await prefs.remove('current_working_hours');

    try {
      await BackgroundTimerService.stopBackgroundTimer();
    } catch (e) {
      _logger.e('Error stopping background timer: $e');
    }

    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
