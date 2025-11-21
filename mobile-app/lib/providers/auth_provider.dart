import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/services/api_service.dart';
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
    _checkAuthStatus();
  }
  
  Future<void> _checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConfig.tokenKey);
    
    if (token != null) {
      _isAuthenticated = true;
      final userDataString = prefs.getString(AppConfig.userKey);
      if (userDataString != null) {
        try {
          // Parse JSON string to Map
          _user = Map<String, dynamic>.from(jsonDecode(userDataString));
        } catch (e) {
          _logger.e('Error parsing user data: $e');
          // Try to refresh user data from dashboard
          try {
            final dashboardResult = await _apiService.getDashboard(token);
            final apiResponse = dashboardResult['Result'] ?? dashboardResult;
            if (apiResponse != null) {
              _user = {
                'id': apiResponse['id'],
                'userName': apiResponse['userName'],
                'employeeName': apiResponse['employeeName'],
                'employeeId': apiResponse['employeeId'] ?? apiResponse['EMPID'],
                'EMPID': apiResponse['EMPID'] ?? apiResponse['employeeId'],
                'role': apiResponse['role'],
                'token': token,
              };
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
  
  Future<bool> login(String userName, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Step 1: Login and get token
      final loginResult = await _apiService.employeeLogin(userName, password);
      
      // Backend returns 'tokensss', but we normalize it to 'token'
      final token = loginResult['token'] ?? loginResult['tokensss'];
      
      if (token == null) {
        _error = 'Invalid credentials - no token received';
        _isLoading = false;
        notifyListeners();
        return false;
      }
      
      // Step 2: Store token
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConfig.tokenKey, token);
      
      // Step 3: Get user details from dashboard endpoint (like frontend does)
      try {
        final dashboardResult = await _apiService.getDashboard(token);
        
        // Handle both response structures: dashboardResult.Result or dashboardResult directly
        final apiResponse = dashboardResult['Result'] ?? dashboardResult;
        
        if (apiResponse != null && apiResponse.isNotEmpty) {
          // Store user details (matching frontend structure)
          final userData = {
            'id': apiResponse['id'],
            'userName': apiResponse['userName'],
            'employeeName': apiResponse['employeeName'],
            'employeeId': apiResponse['employeeId'] ?? apiResponse['EMPID'],
            'EMPID': apiResponse['EMPID'] ?? apiResponse['employeeId'],
            'role': apiResponse['role'],
            'tlName': apiResponse['tlName'],
            'hrName': apiResponse['hrName'],
            'token': token, // Store normalized token
          };
          
          // Store user data as JSON string
          await prefs.setString(AppConfig.userKey, jsonEncode(userData));
          
          _user = userData;
          _isAuthenticated = true;
          _isLoading = false;
          notifyListeners();
          return true;
        } else {
          _error = 'Failed to fetch user details';
          _isLoading = false;
          notifyListeners();
          return false;
        }
      } catch (e) {
        _logger.e('Error fetching dashboard: $e');
        // Even if dashboard fails, we have the token, so we can still proceed
        // Store minimal user data from login response
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
      // Make error messages more user-friendly
      if (errorMsg.contains('Connection error') || errorMsg.contains('Cannot connect')) {
        _error = 'Cannot connect to server. Please ensure the backend is running on port 8000.';
      } else {
        _error = errorMsg;
      }
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
  
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.tokenKey);
    await prefs.remove(AppConfig.userKey);
    
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

