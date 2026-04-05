import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';

class ChallengeAuthProvider with ChangeNotifier {
  final ChallengeApiService _api = ChallengeApiService();

  bool _isLoading = false;
  bool _isAuthenticated = false;
  Map<String, dynamic>? _user;
  String? _error;

  /// Completes after reading stored My Self token/user from disk (for routing on splash/login).
  late final Future<void> sessionReady;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;

  ChallengeAuthProvider() {
    sessionReady = _loadStoredAuth();
  }

  Future<void> _loadStoredAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConfig.challengeTokenKey);
    final userJson = prefs.getString(AppConfig.challengeUserKey);
    if (token != null && userJson != null) {
      try {
        _user = Map<String, dynamic>.from(jsonDecode(userJson));
        _isAuthenticated = true;
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> sendOtp(String email) async {
    _error = null;
    notifyListeners();
    try {
      await _api.sendOtp(email);
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> register({
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
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _api.register(
        name: name,
        phone: phone,
        email: email,
        password: password,
        otp: otp,
        age: age,
        gender: gender,
        location: location,
        address: address,
        referrerEmail: referrerEmail,
      );
      final token = result['token'] as String?;
      final user = result['user'] as Map<String, dynamic>?;
      if (token != null && user != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConfig.challengeTokenKey, token);
        await prefs.setString(AppConfig.challengeUserKey, jsonEncode(user));
        _user = user;
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _api.login(email, password);
      final token = result['token'] as String?;
      final user = result['user'] as Map<String, dynamic>?;
      if (token != null && user != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConfig.challengeTokenKey, token);
        await prefs.setString(AppConfig.challengeUserKey, jsonEncode(user));
        _user = user;
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.challengeTokenKey);
    await prefs.remove(AppConfig.challengeUserKey);
    _user = null;
    _isAuthenticated = false;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Set session from SSO (e.g. employee token exchange). Saves token and user, updates state.
  Future<void> setSessionFromSso(String token, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.challengeTokenKey, token);
    await prefs.setString(AppConfig.challengeUserKey, jsonEncode(user));
    _user = user;
    _isAuthenticated = true;
    _error = null;
    notifyListeners();
  }
}
