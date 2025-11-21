import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:logger/logger.dart';

class ApiService {
  final Dio _dio = Dio();
  final Logger _logger = Logger();
  
  ApiService() {
    _dio.options.baseUrl = AppConfig.baseUrl;
    _dio.options.connectTimeout = AppConfig.requestTimeout;
    _dio.options.receiveTimeout = AppConfig.requestTimeout;
    
    // Log the base URL for debugging
    _logger.i('API Service initialized with baseUrl: ${AppConfig.baseUrl}');
    
    // Request interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Ensure baseUrl is always correct (prevent any override)
        if (options.baseUrl != AppConfig.baseUrl) {
          _logger.w('BaseURL mismatch detected! Resetting to ${AppConfig.baseUrl}');
          options.baseUrl = AppConfig.baseUrl;
        }
        
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConfig.tokenKey);
        
        if (token != null) {
          // Add token to body for POST requests (backend expects tokensss in body)
          if (options.method == 'POST' || options.method == 'PUT') {
            if (options.data is Map) {
              options.data['tokensss'] = token;
            } else if (options.data is FormData) {
              options.data.fields.add(MapEntry('tokensss', token));
            }
          }
          // Also add to header as fallback
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        // Log full URL for debugging
        final fullUrl = '${options.baseUrl}${options.path}';
        _logger.d('Request: ${options.method} $fullUrl');
        _logger.d('Base URL: ${options.baseUrl}, Path: ${options.path}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        _logger.d('Response: ${response.statusCode} ${response.requestOptions.path}');
        return handler.next(response);
      },
      onError: (error, handler) {
        _logger.e('Error: ${error.message}');
        return handler.next(error);
      },
    ));
  }
  
  // Employee Login
  Future<Map<String, dynamic>> employeeLogin(String userName, String password) async {
    try {
      final response = await _dio.post(
        AppConfig.loginEndpoint,
        data: {
          'userName': userName,
          'password': password,
        },
      );
      
      if (response.data['Status'] == 'Success') {
        final result = response.data['Result'];
        // Backend returns 'tokensss' but we'll use 'token' for consistency
        if (result['tokensss'] != null) {
          result['token'] = result['tokensss'];
        }
        return result;
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Login failed');
      }
    } on DioException catch (e) {
      String errorMessage = 'Connection error';
      if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check:\n'
            '1. Backend server is running on port 8000\n'
            '2. API URL is correct in app_config.dart\n'
            '3. CORS is configured on backend';
      } else if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
      } else {
        errorMessage = e.message ?? 'Network error';
      }
      _logger.e('Login error: $errorMessage');
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Login error: $e');
      rethrow;
    }
  }
  
  // Get Dashboard Data (user details)
  Future<Map<String, dynamic>> getDashboard(String token) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      final response = await _dio.post(
        AppConfig.dashboardEndpoint,
        data: {
          'tokensss': token, // Backend expects token in body as 'tokensss'
        },
      );
      
      if (response.data['Status'] == 'Success') {
        // Handle both response structures: response.data.Result or response.data directly
        final apiResponse = response.data['Result'] ?? response.data;
        return apiResponse;
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch dashboard');
      }
    } on DioException catch (e) {
      String errorMessage = 'Failed to fetch user details';
      if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
      } else {
        errorMessage = e.message ?? 'Network error';
      }
      _logger.e('Dashboard error: $errorMessage');
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Dashboard error: $e');
      rethrow;
    }
  }
  
  // Clock In
  Future<Map<String, dynamic>> clockIn({
    required String employeeId,
    required String employeeName,
    String? projectName,
    String? referenceNo,
    String? areaOfWork,
  }) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      final response = await _dio.post(
        AppConfig.clockInEndpoint,
        data: {
          'employeeId': employeeId,
          'employeeName': employeeName,
          'projectName': projectName ?? '',
          'referenceNo': referenceNo ?? '',
          'areaOfWork': areaOfWork ?? '',
          'date': DateTime.now().toIso8601String().split('T')[0],
          'clockInTime': DateTime.now().toIso8601String(),
        },
      );
      
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Clock in failed');
      }
    } on DioException catch (e) {
      String errorMessage = 'Connection error';
      if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check:\n'
            '1. Backend server is running on port 8000\n'
            '2. API URL is correct in app_config.dart\n'
            '3. CORS is configured on backend';
      } else if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
      } else {
        errorMessage = e.message ?? 'Network error';
      }
      _logger.e('Clock in error: $errorMessage');
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Clock in error: $e');
      rethrow;
    }
  }
  
  // Clock Out
  Future<Map<String, dynamic>> clockOut({
    required String employeeId,
    required String workDetailId,
    String? description,
  }) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      final response = await _dio.post(
        AppConfig.clockOutEndpoint,
        data: {
          'employeeId': employeeId,
          'workDetailId': workDetailId,
          'clockOutTime': DateTime.now().toIso8601String(),
          'description': description ?? '',
        },
      );
      
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Clock out failed');
      }
    } on DioException catch (e) {
      String errorMessage = 'Connection error';
      if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check:\n'
            '1. Backend server is running on port 8000\n'
            '2. API URL is correct in app_config.dart\n'
            '3. CORS is configured on backend';
      } else if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
      } else {
        errorMessage = e.message ?? 'Network error';
      }
      _logger.e('Clock out error: $errorMessage');
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Clock out error: $e');
      rethrow;
    }
  }
  
  // Apply Leave
  Future<Map<String, dynamic>> applyLeave({
    required String employeeId,
    required String employeeName,
    required String leaveType,
    required String leaveFrom,
    required String leaveTo,
    String? reason,
  }) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      final response = await _dio.post(
        AppConfig.leaveEndpoint,
        data: {
          'employeeId': employeeId,
          'employeeName': employeeName,
          'leaveType': leaveType,
          'leaveFrom': leaveFrom,
          'leaveTo': leaveTo,
          'reason': reason ?? '',
        },
      );
      
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Leave application failed');
      }
    } on DioException catch (e) {
      String errorMessage = 'Connection error';
      if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check:\n'
            '1. Backend server is running on port 8000\n'
            '2. API URL is correct in app_config.dart\n'
            '3. CORS is configured on backend';
      } else if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
      } else {
        errorMessage = e.message ?? 'Network error';
      }
      _logger.e('Apply leave error: $errorMessage');
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Apply leave error: $e');
      rethrow;
    }
  }
  
  // Get Timesheet
  Future<List<dynamic>> getTimesheet({
    String? employeeId,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (employeeId != null) queryParams['employeeId'] = employeeId;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      
      final response = await _dio.get(
        AppConfig.timesheetEndpoint,
        queryParameters: queryParams,
      );
      
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch timesheet');
      }
    } on DioException catch (e) {
      String errorMessage = 'Connection error';
      if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check:\n'
            '1. Backend server is running on port 8000\n'
            '2. API URL is correct in app_config.dart\n'
            '3. CORS is configured on backend';
        _logger.w('Connection error: Cannot reach backend at ${AppConfig.baseUrl}. Is the server running?');
      } else if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
        _logger.e('Get timesheet error: $errorMessage');
      } else {
        errorMessage = e.message ?? 'Network error';
        _logger.e('Get timesheet error: $errorMessage');
      }
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Get timesheet error: $e');
      rethrow;
    }
  }
  
  // Get Shift Assignments
  Future<List<dynamic>> getShiftAssignments({String? employeeId}) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      final queryParams = <String, dynamic>{};
      if (employeeId != null) queryParams['employeeId'] = employeeId;
      
      final response = await _dio.get(
        AppConfig.shiftEndpoint,
        queryParameters: queryParams,
      );
      
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch shifts');
      }
    } on DioException catch (e) {
      String errorMessage = 'Connection error';
      if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check:\n'
            '1. Backend server is running on port 8000\n'
            '2. API URL is correct in app_config.dart\n'
            '3. CORS is configured on backend';
        _logger.w('Connection error: Cannot reach backend at ${AppConfig.baseUrl}. Is the server running?');
      } else if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
        _logger.e('Get shifts error: $errorMessage');
      } else {
        errorMessage = e.message ?? 'Network error';
        _logger.e('Get shifts error: $errorMessage');
      }
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Get shifts error: $e');
      rethrow;
    }
  }
  
  // Get Notifications
  Future<List<dynamic>> getNotifications({String? employeeId}) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      final queryParams = <String, dynamic>{};
      if (employeeId != null) queryParams['employeeId'] = employeeId;
      
      final response = await _dio.get(
        AppConfig.notificationEndpoint,
        queryParameters: queryParams,
      );
      
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch notifications');
      }
    } on DioException catch (e) {
      String errorMessage = 'Connection error';
      if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to server. Please check:\n'
            '1. Backend server is running on port 8000\n'
            '2. API URL is correct in app_config.dart\n'
            '3. CORS is configured on backend';
        _logger.w('Connection error: Cannot reach backend at ${AppConfig.baseUrl}. Is the server running?');
      } else if (e.response != null) {
        errorMessage = e.response?.data['Message'] ?? 
                      e.response?.data['Error'] ?? 
                      'Server error: ${e.response?.statusCode}';
        _logger.e('Get notifications error: $errorMessage');
      } else {
        errorMessage = e.message ?? 'Network error';
        _logger.e('Get notifications error: $errorMessage');
      }
      throw Exception(errorMessage);
    } catch (e) {
      _logger.e('Get notifications error: $e');
      rethrow;
    }
  }
}

