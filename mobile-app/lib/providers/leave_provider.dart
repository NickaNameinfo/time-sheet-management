import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:logger/logger.dart';

class LeaveProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();
  
  bool _isLoading = false;
  List<Map<String, dynamic>> _leaves = [];
  String? _error;
  
  bool get isLoading => _isLoading;
  List<Map<String, dynamic>> get leaves => _leaves;
  String? get error => _error;
  
  Future<bool> applyLeave({
    required String employeeId,
    required String employeeName,
    required String leaveType,
    required String leaveFrom,
    required String leaveTo,
    String? reason,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Check connectivity
      final connectivityResult = await Connectivity().checkConnectivity();
      final isOnline = connectivityResult != ConnectivityResult.none;
      
      final leaveData = {
        'employeeId': employeeId,
        'employeeName': employeeName,
        'leaveType': leaveType,
        'leaveFrom': leaveFrom,
        'leaveTo': leaveTo,
        'reason': reason ?? '',
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      if (isOnline) {
        try {
          final result = await _apiService.applyLeave(
            employeeId: employeeId,
            employeeName: employeeName,
            leaveType: leaveType,
            leaveFrom: leaveFrom,
            leaveTo: leaveTo,
            reason: reason,
          );
          
          _isLoading = false;
          notifyListeners();
          return true;
        } catch (e) {
          _logger.w('Online leave application failed, queueing for offline: $e');
          // Fall through to offline queue
        }
      }
      
      // Queue for offline sync
      await OfflineService.queueLeave(leaveData);
      
      _isLoading = false;
      notifyListeners();
      
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
  
  Future<void> loadLeaves({String? employeeId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Try to load from cache first
      final cached = await OfflineService.getCachedData('leaves_$employeeId');
      if (cached != null && cached['data'] != null) {
        _leaves = List<Map<String, dynamic>>.from(cached['data']);
        _isLoading = false;
        notifyListeners();
      }
      
      // Check connectivity
      final connectivityResult = await Connectivity().checkConnectivity();
      final isOnline = connectivityResult != ConnectivityResult.none;
      
      if (isOnline) {
        try {
          // Load from API
          // Note: Adjust endpoint based on your API
          _isLoading = false;
          notifyListeners();
        } catch (e) {
          _logger.e('Error loading leaves: $e');
          _error = 'Failed to load leaves';
          _isLoading = false;
          notifyListeners();
        }
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

