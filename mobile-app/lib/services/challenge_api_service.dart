import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:logger/logger.dart';

/// Thrown when the server returns 401; session is cleared and user is sent to login.
class SessionExpiredException implements Exception {
  final String message;
  SessionExpiredException([this.message = 'Session expired. Please log in again.']);
  @override
  String toString() => message;
}

class ChallengeApiService {
  final Dio _dio = Dio();
  final Logger _logger = Logger();

  /// Set from main.dart. Called when a 401 is received so app can show popup and navigate to login.
  static void Function()? onSessionExpired;

  ChallengeApiService() {
    _dio.options.baseUrl = AppConfig.baseUrl;
    _dio.options.connectTimeout = AppConfig.requestTimeout;
    _dio.options.receiveTimeout = AppConfig.requestTimeout;
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConfig.challengeTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          _logger.w('Challenge API 401 Unauthorized – clearing session and redirecting to login');
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove(AppConfig.challengeTokenKey);
          await prefs.remove(AppConfig.challengeUserKey);
          onSessionExpired?.call();
          return handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: DioExceptionType.badResponse,
              error: SessionExpiredException(),
            ),
          );
        }
        return handler.next(error);
      },
    ));
  }

  Future<Map<String, dynamic>> _handleResponse(Response response) async {
    final data = response.data;
    if (data is! Map) throw Exception('Invalid response');
    if (data['Status'] == 'Error') {
      throw Exception(data['Error'] ?? 'Request failed');
    }
    return Map<String, dynamic>.from(data);
  }

  Future<void> sendOtp(String email) async {
    try {
      final response = await _dio.post(
        AppConfig.challengeAuthSendOtp,
        data: {'email': email.trim().toLowerCase()},
      );
      await _handleResponse(response);
    } on DioException catch (e) {
      if (e.response?.statusCode != null) {
        final msg = e.response?.data is Map && (e.response!.data as Map)['Error'] != null
            ? (e.response!.data as Map)['Error'].toString()
            : 'Failed to send OTP. Please try again.';
        throw Exception(msg);
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    required String email,
    required String password,
    required String otp,
    String? age,
    String? gender,
    String? location,
    String? address,
    String? referrerEmail,
  }) async {
    try {
      final response = await _dio.post(
        AppConfig.challengeAuthRegister,
        data: {
          'name': name,
          'phone': phone,
          'email': email,
          'password': password,
          'otp': otp.trim(),
          if (age != null && age.isNotEmpty) 'age': int.tryParse(age),
          if (gender != null && gender.isNotEmpty) 'gender': gender,
          if (location != null && location.isNotEmpty) 'location': location,
          if (address != null && address.isNotEmpty) 'address': address,
          if (referrerEmail != null && referrerEmail.trim().isNotEmpty) 'referrer_email': referrerEmail.trim(),
        },
      );
      final result = await _handleResponse(response);
      return result['Result'] as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception(
          'Registration is not available. Please ensure the server is updated with the My Self feature, or try again later.',
        );
      }
      if (e.response?.statusCode != null) {
        final msg = e.response?.data is Map && (e.response!.data as Map)['Error'] != null
            ? (e.response!.data as Map)['Error'].toString()
            : 'Server error. Please try again.';
        throw Exception(msg);
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        AppConfig.challengeAuthLogin,
        data: {'email': email.trim(), 'password': password},
      );
      final result = await _handleResponse(response);
      return result['Result'] as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        final msg = (e.response!.data as Map)['Error']?.toString();
        if (msg != null && msg.isNotEmpty) {
          throw Exception(msg);
        }
      }
      if (e.response?.statusCode == 401) {
        throw Exception('Invalid email or password');
      }
      if (e.response?.statusCode != null) {
        throw Exception('Unable to sign in. Please try again.');
      }
      rethrow;
    }
  }

  Future<void> sendResetOtp(String email) async {
    try {
      final response = await _dio.post(
        AppConfig.challengeAuthSendResetOtp,
        data: {'email': email.trim().toLowerCase()},
      );
      await _handleResponse(response);
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        final msg = (e.response!.data as Map)['Error']?.toString();
        if (msg != null && msg.isNotEmpty) throw Exception(msg);
      }
      if (e.response?.statusCode == 404) {
        throw Exception('No account found with this email');
      }
      throw Exception('Failed to send code. Please try again.');
    }
  }

  Future<void> resetPassword({required String email, required String otp, required String newPassword}) async {
    try {
      final response = await _dio.post(
        AppConfig.challengeAuthResetPassword,
        data: {
          'email': email.trim().toLowerCase(),
          'otp': otp.trim(),
          'new_password': newPassword,
        },
      );
      await _handleResponse(response);
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        final msg = (e.response!.data as Map)['Error']?.toString();
        if (msg != null && msg.isNotEmpty) throw Exception(msg);
      }
      throw Exception('Failed to reset password. Please try again.');
    }
  }

  Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    try {
      final response = await _dio.post(
        AppConfig.challengeAuthChangePassword,
        data: {'current_password': currentPassword, 'new_password': newPassword},
      );
      await _handleResponse(response);
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        final msg = (e.response!.data as Map)['Error']?.toString();
        if (msg != null && msg.isNotEmpty) throw Exception(msg);
      }
      if (e.response?.statusCode == 401) {
        throw Exception('Current password is incorrect');
      }
      throw Exception('Failed to change password. Please try again.');
    }
  }

  /// Use employee (Time Sheet) token to get My Self access without separate login.
  Future<Map<String, dynamic>> accessWithEmployeeToken(String employeeToken) async {
    final response = await _dio.post(
      AppConfig.challengeAuthAccessWithEmployee,
      options: Options(headers: {'Authorization': 'Bearer $employeeToken'}),
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get(AppConfig.challengeDashboard);
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> listChallenges({String? status}) async {
    final response = await _dio.get(
      AppConfig.challengeList,
      queryParameters: status != null ? {'status': status} : null,
    );
    final result = await _handleResponse(response);
    final list = result['Result'];
    return list is List ? list : [];
  }

  Future<Map<String, dynamic>> getChallenge(String id) async {
    final response = await _dio.get('/challenge/$id');
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createChallenge({
    required String title,
    String? description,
    required int totalDays,
    required String startDate,
    String? reminderTime,
  }) async {
    final response = await _dio.post(
      '/challenge',
      data: {
        'title': title,
        'description': description,
        'total_days': totalDays,
        'start_date': startDate,
        'reminder_time': reminderTime,
      },
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>;
  }

  Future<void> updateReminder(String challengeId, String? reminderTime) async {
    await _dio.put('/challenge/$challengeId/reminder', data: {'reminder_time': reminderTime});
  }

  Future<void> markDayComplete(String dayId) async {
    await _dio.post('/challenge/day/$dayId/complete');
  }

  Future<Map<String, dynamic>> getReports({String? filter}) async {
    final response = await _dio.get(
      AppConfig.challengeReports,
      queryParameters: filter != null ? {'filter': filter} : null,
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getSettings() async {
    final response = await _dio.get(AppConfig.challengeSettings);
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>;
  }

  Future<void> updateSettings({
    bool? reminderEnabled,
    bool? eodReminderEnabled,
    bool? missedAlertEnabled,
    String? timezone,
  }) async {
    await _dio.put(
      AppConfig.challengeSettings,
      data: {
        if (reminderEnabled != null) 'reminder_enabled': reminderEnabled,
        if (eodReminderEnabled != null) 'eod_reminder_enabled': eodReminderEnabled,
        if (missedAlertEnabled != null) 'missed_alert_enabled': missedAlertEnabled,
        if (timezone != null) 'timezone': timezone,
      },
    );
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dio.get(AppConfig.challengeProfile);
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>;
  }

  Future<void> updateProfile({
    String? name,
    String? age,
    String? gender,
    String? location,
    String? address,
  }) async {
    await _dio.put(
      AppConfig.challengeProfile,
      data: {
        if (name != null) 'name': name,
        if (age != null) 'age': age,
        if (gender != null) 'gender': gender,
        if (location != null) 'location': location,
        if (address != null) 'address': address,
      },
    );
  }

  Future<void> deleteAccount() async {
    await _dio.delete('/challenge/account');
  }
}
