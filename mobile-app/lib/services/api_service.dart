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
    String? employeeNo,
    String projectName = '',
    String referenceNo = '',
    String areaOfWork = '',
    String? projectNo,
    String? taskNo,
    String? variation,
    String? subDivision,
    String? subDivisionList,
    String? allotatedHours,
    String? desciplineCode,
    String? designation,
    String? tlName,
  }) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      // Prepare data - include all work details fields (matching ClockInOutCard.jsx)
      // Always send all fields, use empty string if not provided (backend expects this)
      final clockInData = {
        'employeeId': employeeId,
        'employeeName': employeeName.trim(),
        'employeeNo': employeeNo ?? employeeId, // Match frontend: employeeNo: user?.id
        'date': DateTime.now().toIso8601String().split('T')[0],
        // Ensure clockInTime includes 'Z' timezone indicator to match frontend format
        'clockInTime': DateTime.now().toUtc().toIso8601String(),
        'projectName': projectName.trim(),
        'referenceNo': referenceNo.trim(),
        'areaOfWork': areaOfWork.trim(),
        // Additional work details fields - always send, use empty string if null
        'projectNo': (projectNo != null && projectNo.isNotEmpty) ? projectNo.trim() : '',
        'taskNo': (taskNo != null && taskNo.isNotEmpty) ? taskNo.trim() : '',
        'variation': (variation != null && variation.isNotEmpty) ? variation.trim() : '',
        'subDivision': (subDivision != null && subDivision.isNotEmpty) ? subDivision.trim() : '',
        'subDivisionList': (subDivisionList != null && subDivisionList.isNotEmpty) ? subDivisionList.trim() : '',
        'allotatedHours': (allotatedHours != null && allotatedHours.isNotEmpty) ? allotatedHours.trim() : '',
        'desciplineCode': (desciplineCode != null && desciplineCode.isNotEmpty) ? desciplineCode.trim() : '',
        'designation': (designation != null && designation.isNotEmpty) ? designation.trim() : '',
      };
      
      // Only send tlName if it has a value, otherwise omit it (backend will get it from project)
      if (tlName != null && tlName.isNotEmpty) {
        clockInData['tlName'] = tlName.trim();
      }
      
      _logger.d('Clock In Request Data: $clockInData');
      
      final response = await _dio.post(
        AppConfig.clockInEndpoint,
        data: clockInData,
      );
      
      _logger.d('Clock In Response: ${response.statusCode}');
      _logger.d('Clock In Response Data: ${response.data}');
      
      if (response.data['Status'] == 'Success') {
        final result = response.data['Result'] ?? {};
        _logger.d('Clock In Success - Result: $result');
        return result;
      } else {
        final errorMsg = response.data['Message'] ?? response.data['Error'] ?? 'Clock in failed';
        _logger.e('Clock In Failed: $errorMsg');
        throw Exception(errorMsg);
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
    String? clockOutTime,
    String? description,
  }) async {
    try {
      // Ensure baseUrl is correct before request
      _dio.options.baseUrl = AppConfig.baseUrl;
      
      // Match frontend: clockOutTime: new Date().toISOString()
      final response = await _dio.post(
        AppConfig.clockOutEndpoint,
        data: {
          'employeeId': employeeId,
          'workDetailId': workDetailId,
          'clockOutTime': clockOutTime ?? DateTime.now().toIso8601String(),
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

  // HR Login
  Future<Map<String, dynamic>> hrLogin(String userName, String password) async {
    try {
      final response = await _dio.post(
        '/hrLogin',
        data: {'userName': userName, 'password': password},
      );
      if (response.data['Status'] == 'Success') {
        final result = response.data['Result'];
        if (result['tokensss'] != null) {
          result['token'] = result['tokensss'];
        }
        return result;
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Login failed');
      }
    } catch (e) {
      _logger.e('HR Login error: $e');
      rethrow;
    }
  }

  // Team Lead Login
  Future<Map<String, dynamic>> teamLeadLogin(String userName, String password) async {
    try {
      final response = await _dio.post(
        '/teamLeadlogin',
        data: {'userName': userName, 'password': password},
      );
      if (response.data['Status'] == 'Success') {
        final result = response.data['Result'];
        if (result['token'] != null) {
          result['tokensss'] = result['token'];
        }
        result['role'] = 'teamLead';
        return result;
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Login failed');
      }
    } catch (e) {
      _logger.e('Team Lead Login error: $e');
      rethrow;
    }
  }

  // Get Leave Details
  Future<List<dynamic>> getLeaveDetails({String? employeeId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (employeeId != null) queryParams['employeeId'] = employeeId;
      final response = await _dio.get('/getLeaveDetails', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch leave details');
      }
    } catch (e) {
      _logger.e('Get leave details error: $e');
      rethrow;
    }
  }

  // Get Comp Off Details
  Future<List<dynamic>> getCompOffDetails({String? employeeId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (employeeId != null) queryParams['employeeId'] = employeeId;
      final response = await _dio.get('/getcompOffDetails', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch comp-off details');
      }
    } catch (e) {
      _logger.e('Get comp-off details error: $e');
      rethrow;
    }
  }

  // Apply Comp Off
  Future<Map<String, dynamic>> applyCompOff(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/applycompOff', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Comp-off application failed');
      }
    } catch (e) {
      _logger.e('Apply comp-off error: $e');
      rethrow;
    }
  }

  // Delete Leave
  Future<void> deleteLeave(int id) async {
    try {
      final response = await _dio.delete('/deleteLeave/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete leave');
      }
    } catch (e) {
      _logger.e('Delete leave error: $e');
      rethrow;
    }
  }

  // Delete Comp Off
  Future<void> deleteCompOff(int id) async {
    try {
      final response = await _dio.delete('/deletecompOff/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete comp-off');
      }
    } catch (e) {
      _logger.e('Delete comp-off error: $e');
      rethrow;
    }
  }

  // Get Leave Balance
  Future<List<dynamic>> getLeaveBalance({String? employeeId, int? year}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (employeeId != null) queryParams['employeeId'] = employeeId;
      if (year != null) queryParams['year'] = year;
      final response = await _dio.get('/leave/balance', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch leave balance');
      }
    } catch (e) {
      _logger.e('Get leave balance error: $e');
      rethrow;
    }
  }

  // Initialize Leave Balance
  Future<Map<String, dynamic>> initializeLeaveBalance(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/leave/balance/initialize', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to initialize leave balance');
      }
    } catch (e) {
      _logger.e('Initialize leave balance error: $e');
      rethrow;
    }
  }

  // Accrue Leave
  Future<Map<String, dynamic>> accrueLeave(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/leave/accrue', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to accrue leave');
      }
    } catch (e) {
      _logger.e('Accrue leave error: $e');
      rethrow;
    }
  }

  // Get Employees
  Future<List<dynamic>> getEmployees() async {
    try {
      final response = await _dio.get('/getEmployee');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch employees');
      }
    } catch (e) {
      _logger.e('Get employees error: $e');
      rethrow;
    }
  }

  // Get Employee by ID
  Future<Map<String, dynamic>> getEmployee(int id) async {
    try {
      final response = await _dio.get('/get/$id');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch employee');
      }
    } catch (e) {
      _logger.e('Get employee error: $e');
      rethrow;
    }
  }

  // Create Employee
  Future<Map<String, dynamic>> createEmployee(Map<String, dynamic> data) async {
    try {
      final formData = FormData.fromMap(data);
      final response = await _dio.post('/create', data: formData);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to create employee');
      }
    } catch (e) {
      _logger.e('Create employee error: $e');
      rethrow;
    }
  }

  // Update Employee
  Future<Map<String, dynamic>> updateEmployee(int id, Map<String, dynamic> data) async {
    try {
      final formData = FormData.fromMap(data);
      final response = await _dio.put('/update/$id', data: formData);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to update employee');
      }
    } catch (e) {
      _logger.e('Update employee error: $e');
      rethrow;
    }
  }

  // Delete Employee
  Future<void> deleteEmployee(int id) async {
    try {
      final response = await _dio.delete('/delete/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete employee');
      }
    } catch (e) {
      _logger.e('Delete employee error: $e');
      rethrow;
    }
  }

  // Approve/Reject Entity (Leave, Comp-Off, Timesheet, etc.)
  Future<Map<String, dynamic>> approveEntity({
    required String entityType,
    required int entityId,
    required String status,
    required String approverId,
    String? comments,
  }) async {
    try {
      final response = await _dio.post(
        '/approvals/$entityType/$entityId',
        data: {
          'status': status,
          'approverId': approverId,
          if (comments != null) 'comments': comments,
        },
      );
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to approve/reject');
      }
    } catch (e) {
      _logger.e('Approve entity error: $e');
      rethrow;
    }
  }

  // Get Pending Approvals
  Future<List<dynamic>> getPendingApprovals({String? approverId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (approverId != null) queryParams['approverId'] = approverId;
      final response = await _dio.get('/approvals/pending', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch pending approvals');
      }
    } catch (e) {
      _logger.e('Get pending approvals error: $e');
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _dio.get('/logout');
    } catch (e) {
      _logger.e('Logout error: $e');
      // Continue with logout even if API call fails
    }
  }

  // Get Projects
  Future<List<dynamic>> getProjects() async {
    try {
      final response = await _dio.get('/getProject');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch projects');
      }
    } catch (e) {
      _logger.e('Get projects error: $e');
      rethrow;
    }
  }

  // Get Work Details
  Future<List<dynamic>> getWorkDetails({String? employeeId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (employeeId != null) queryParams['employeeId'] = employeeId;
      final response = await _dio.get('/getWorkDetails', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch work details');
      }
    } catch (e) {
      _logger.e('Get work details error: $e');
      rethrow;
    }
  }

  // Filter Time Sheet
  Future<List<dynamic>> filterTimeSheet(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/filterTimeSheet', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to filter timesheet');
      }
    } catch (e) {
      _logger.e('Filter timesheet error: $e');
      rethrow;
    }
  }

  // Get Shifts
  Future<List<dynamic>> getShifts({bool? isActive}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (isActive != null) queryParams['isActive'] = isActive;
      final response = await _dio.get('/shifts', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch shifts');
      }
    } catch (e) {
      _logger.e('Get shifts error: $e');
      rethrow;
    }
  }

  // Get Settings
  Future<Map<String, dynamic>> getSettings() async {
    try {
      final response = await _dio.get('/settings');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch settings');
      }
    } catch (e) {
      _logger.e('Get settings error: $e');
      rethrow;
    }
  }

  // Get Area of Work
  Future<List<dynamic>> getAreaOfWork() async {
    try {
      final response = await _dio.get('/areaofwork');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch area of work');
      }
    } catch (e) {
      _logger.e('Get area of work error: $e');
      rethrow;
    }
  }

  // Get Variations
  Future<List<dynamic>> getVariations() async {
    try {
      final response = await _dio.get('/variation');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch variations');
      }
    } catch (e) {
      _logger.e('Get variations error: $e');
      rethrow;
    }
  }

  // Get Disciplines
  Future<List<dynamic>> getDisciplines() async {
    try {
      final response = await _dio.get('/discipline');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch disciplines');
      }
    } catch (e) {
      _logger.e('Get disciplines error: $e');
      rethrow;
    }
  }

  // Create Discipline
  Future<Map<String, dynamic>> createDiscipline(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/create/discipline', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to create discipline');
      }
    } catch (e) {
      _logger.e('Create discipline error: $e');
      rethrow;
    }
  }

  // Delete Discipline
  Future<void> deleteDiscipline(int id) async {
    try {
      final response = await _dio.delete('/discipline/delete/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete discipline');
      }
    } catch (e) {
      _logger.e('Delete discipline error: $e');
      rethrow;
    }
  }

  // Get Designations
  Future<List<dynamic>> getDesignations() async {
    try {
      final response = await _dio.get('/designation');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch designations');
      }
    } catch (e) {
      _logger.e('Get designations error: $e');
      rethrow;
    }
  }

  // Create Designation
  Future<Map<String, dynamic>> createDesignation(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/create/designation', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to create designation');
      }
    } catch (e) {
      _logger.e('Create designation error: $e');
      rethrow;
    }
  }

  // Delete Designation
  Future<void> deleteDesignation(int id) async {
    try {
      final response = await _dio.delete('/designation/delete/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete designation');
      }
    } catch (e) {
      _logger.e('Delete designation error: $e');
      rethrow;
    }
  }

  // Create Area of Work
  Future<Map<String, dynamic>> createAreaOfWork(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/create/areaofwork', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to create area of work');
      }
    } catch (e) {
      _logger.e('Create area of work error: $e');
      rethrow;
    }
  }

  // Delete Area of Work
  Future<void> deleteAreaOfWork(int id) async {
    try {
      final response = await _dio.delete('/areaofwork/delete/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete area of work');
      }
    } catch (e) {
      _logger.e('Delete area of work error: $e');
      rethrow;
    }
  }

  // Create Variation
  Future<Map<String, dynamic>> createVariation(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/create/variation', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to create variation');
      }
    } catch (e) {
      _logger.e('Create variation error: $e');
      rethrow;
    }
  }

  // Delete Variation
  Future<void> deleteVariation(int id) async {
    try {
      final response = await _dio.delete('/variation/delete/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete variation');
      }
    } catch (e) {
      _logger.e('Delete variation error: $e');
      rethrow;
    }
  }

  // Create Update/Announcement
  Future<Map<String, dynamic>> createUpdate(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/create/updates', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to create update');
      }
    } catch (e) {
      _logger.e('Create update error: $e');
      rethrow;
    }
  }

  // Add Work Details
  Future<Map<String, dynamic>> addWorkDetails(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/project/addWorkDetails', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to add work details');
      }
    } catch (e) {
      _logger.e('Add work details error: $e');
      rethrow;
    }
  }

  // Update Work Details
  Future<Map<String, dynamic>> updateWorkDetails(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/project/updateWorkDetails/$id', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to update work details');
      }
    } catch (e) {
      _logger.e('Update work details error: $e');
      rethrow;
    }
  }

  // ========== NEW API METHODS FOR RECENT FEATURES ==========

  // Budget Tracking - Get Project Budget
  Future<List<dynamic>> getProjectBudget(String projectId) async {
    try {
      final response = await _dio.get('/projects/$projectId/budget');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch project budget');
      }
    } catch (e) {
      _logger.e('Get project budget error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Set Project Budget
  Future<Map<String, dynamic>> setProjectBudget(String projectId, Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/projects/$projectId/budget', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to set project budget');
      }
    } catch (e) {
      _logger.e('Set project budget error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Update Project Budget
  Future<Map<String, dynamic>> updateProjectBudget(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/projects/budget/$id', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to update project budget');
      }
    } catch (e) {
      _logger.e('Update project budget error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Delete Project Budget
  Future<void> deleteProjectBudget(int id) async {
    try {
      final response = await _dio.delete('/projects/budget/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete project budget');
      }
    } catch (e) {
      _logger.e('Delete project budget error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Track Project Cost
  Future<Map<String, dynamic>> trackProjectCost(String projectId, Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/projects/$projectId/costs', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to track project cost');
      }
    } catch (e) {
      _logger.e('Track project cost error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Get Project Costs
  Future<List<dynamic>> getProjectCosts(String projectId, {String? startDate, String? endDate}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      
      final response = await _dio.get('/projects/$projectId/costs', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch project costs');
      }
    } catch (e) {
      _logger.e('Get project costs error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Update Project Cost
  Future<Map<String, dynamic>> updateProjectCost(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/projects/costs/$id', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to update project cost');
      }
    } catch (e) {
      _logger.e('Update project cost error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Delete Project Cost
  Future<void> deleteProjectCost(int id) async {
    try {
      final response = await _dio.delete('/projects/costs/$id');
      if (response.data['Status'] != 'Success') {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to delete project cost');
      }
    } catch (e) {
      _logger.e('Delete project cost error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Get Budget vs Actual
  Future<Map<String, dynamic>> getBudgetVsActual(String projectId) async {
    try {
      final response = await _dio.get('/projects/$projectId/budget-vs-actual');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch budget vs actual');
      }
    } catch (e) {
      _logger.e('Get budget vs actual error: $e');
      rethrow;
    }
  }

  // Budget Tracking - Get Profitability Report
  Future<Map<String, dynamic>> getProfitabilityReport(String projectId) async {
    try {
      final response = await _dio.get('/projects/$projectId/profitability');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch profitability report');
      }
    } catch (e) {
      _logger.e('Get profitability report error: $e');
      rethrow;
    }
  }

  // Approval Center - Bulk Approve/Reject
  Future<Map<String, dynamic>> bulkApprove({
    required String entityType,
    required List<int> entityIds,
    required String status, // 'approved' or 'rejected'
    required String approverId,
    String? comments,
  }) async {
    try {
      final response = await _dio.post(
        '/approvals/bulk',
        data: {
          'entityType': entityType,
          'entityIds': entityIds,
          'status': status,
          'approverId': approverId,
          if (comments != null) 'comments': comments,
        },
      );
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to bulk approve/reject');
      }
    } catch (e) {
      _logger.e('Bulk approve error: $e');
      rethrow;
    }
  }

  // Approval Center - Get Approval History
  Future<List<dynamic>> getApprovalHistory({
    String? entityType,
    String? status,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (entityType != null && entityType.isNotEmpty) queryParams['entityType'] = entityType;
      if (status != null && status.isNotEmpty) queryParams['status'] = status;
      if (startDate != null && startDate.isNotEmpty) queryParams['startDate'] = startDate;
      if (endDate != null && endDate.isNotEmpty) queryParams['endDate'] = endDate;
      
      final response = await _dio.get('/approvals/history', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch approval history');
      }
    } catch (e) {
      _logger.e('Get approval history error: $e');
      rethrow;
    }
  }

  // Leave Balance - Update Leave Balance
  Future<Map<String, dynamic>> updateLeaveBalance(Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/leave/balance/update', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to update leave balance');
      }
    } catch (e) {
      _logger.e('Update leave balance error: $e');
      rethrow;
    }
  }

  // Billing - Get Clients
  Future<List<dynamic>> getClients() async {
    try {
      final response = await _dio.get('/clients');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch clients');
      }
    } catch (e) {
      _logger.e('Get clients error: $e');
      rethrow;
    }
  }

  // Billing - Get Invoices
  Future<List<dynamic>> getInvoices({String? clientId, String? status, String? startDate, String? endDate}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (clientId != null) queryParams['clientId'] = clientId;
      if (status != null) queryParams['status'] = status;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      
      final response = await _dio.get('/invoices', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch invoices');
      }
    } catch (e) {
      _logger.e('Get invoices error: $e');
      rethrow;
    }
  }

  // Billing - Get Invoice Details
  Future<Map<String, dynamic>> getInvoiceDetails(int id) async {
    try {
      final response = await _dio.get('/invoices/$id');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch invoice details');
      }
    } catch (e) {
      _logger.e('Get invoice details error: $e');
      rethrow;
    }
  }

  // Billing - Update Invoice
  Future<Map<String, dynamic>> updateInvoice(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/invoices/$id', data: data);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to update invoice');
      }
    } catch (e) {
      _logger.e('Update invoice error: $e');
      rethrow;
    }
  }

  // Productivity - Get Productivity Metrics
  Future<List<dynamic>> getProductivityMetrics({
    String? employeeId,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      // Only include employeeId if it's not empty/null
      if (employeeId != null && employeeId.isNotEmpty && employeeId != 'undefined' && employeeId != 'null') {
        queryParams['employeeId'] = employeeId;
      }
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      
      final response = await _dio.get('/productivity/metrics', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch productivity metrics');
      }
    } catch (e) {
      _logger.e('Get productivity metrics error: $e');
      rethrow;
    }
  }

  // Productivity - Get Team Productivity
  Future<Map<String, dynamic>> getTeamProductivity({
    String? teamLeadId,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (teamLeadId != null) queryParams['teamLeadId'] = teamLeadId;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      
      final response = await _dio.get('/productivity/team', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch team productivity');
      }
    } catch (e) {
      _logger.e('Get team productivity error: $e');
      rethrow;
    }
  }

  // Project Plans - Get Employee Assigned Projects
  Future<List<dynamic>> getEmployeeAssignedProjects({required String employeeId}) async {
    try {
      final response = await _dio.get(
        '/project-plan/employee/assigned',
        queryParameters: {'employee_id': employeeId}, // Backend expects employee_id
      );
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? [];
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch assigned projects');
      }
    } catch (e) {
      _logger.e('Get employee assigned projects error: $e');
      rethrow;
    }
  }

  // Payroll - Generate Payroll Summary
  Future<Map<String, dynamic>> generatePayrollSummary({
    String? employeeId,
    String? startDate,
    String? endDate,
    String? format,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (employeeId != null && employeeId.isNotEmpty) queryParams['employeeId'] = employeeId;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      if (format != null) queryParams['format'] = format;
      
      final response = await _dio.get('/payroll/summary', queryParameters: queryParams);
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to generate payroll summary');
      }
    } catch (e) {
      _logger.e('Generate payroll summary error: $e');
      rethrow;
    }
  }

  // App Settings - Get App Settings
  Future<Map<String, dynamic>> getAppSettings() async {
    try {
      final response = await _dio.get('/settings/app');
      if (response.data['Status'] == 'Success') {
        return response.data['Result'] ?? {};
      } else {
        throw Exception(response.data['Message'] ?? response.data['Error'] ?? 'Failed to fetch app settings');
      }
    } catch (e) {
      _logger.e('Get app settings error: $e');
      rethrow;
    }
  }
}

