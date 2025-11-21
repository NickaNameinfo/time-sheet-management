import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:logger/logger.dart';

class AttendanceProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();
  
  bool _isLoading = false;
  bool _isClockedIn = false;
  Map<String, dynamic>? _currentAttendance;
  String? _error;
  
  bool get isLoading => _isLoading;
  bool get isClockedIn => _isClockedIn;
  Map<String, dynamic>? get currentAttendance => _currentAttendance;
  String? get error => _error;
  
  Future<bool> clockIn({
    required String employeeId,
    required String employeeName,
    String? projectName,
    String? referenceNo,
    String? areaOfWork,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Check connectivity
      final connectivityResult = await Connectivity().checkConnectivity();
      final isOnline = connectivityResult != ConnectivityResult.none;
      
      final clockInData = {
        'employeeId': employeeId,
        'employeeName': employeeName,
        'projectName': projectName ?? '',
        'referenceNo': referenceNo ?? '',
        'areaOfWork': areaOfWork ?? '',
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      if (isOnline) {
        try {
          final result = await _apiService.clockIn(
            employeeId: employeeId,
            employeeName: employeeName,
            projectName: projectName,
            referenceNo: referenceNo,
            areaOfWork: areaOfWork,
          );
          
          _isClockedIn = true;
          _currentAttendance = result;
          _isLoading = false;
          notifyListeners();
          return true;
        } catch (e) {
          _logger.w('Online clock-in failed, queueing for offline: $e');
          // Fall through to offline queue
        }
      }
      
      // Queue for offline sync
      await OfflineService.queueAttendance(
        action: 'clock_in',
        data: clockInData,
      );
      
      _isClockedIn = true;
      _currentAttendance = clockInData;
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
  
  Future<bool> clockOut({
    required String employeeId,
    required String workDetailId,
    String? description,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Check connectivity
      final connectivityResult = await Connectivity().checkConnectivity();
      final isOnline = connectivityResult != ConnectivityResult.none;
      
      final clockOutData = {
        'employeeId': employeeId,
        'workDetailId': workDetailId,
        'description': description ?? '',
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      if (isOnline) {
        try {
          final result = await _apiService.clockOut(
            employeeId: employeeId,
            workDetailId: workDetailId,
            description: description,
          );
          
          _isClockedIn = false;
          _currentAttendance = null;
          _isLoading = false;
          notifyListeners();
          return true;
        } catch (e) {
          _logger.w('Online clock-out failed, queueing for offline: $e');
          // Fall through to offline queue
        }
      }
      
      // Queue for offline sync
      await OfflineService.queueAttendance(
        action: 'clock_out',
        data: clockOutData,
      );
      
      _isClockedIn = false;
      _currentAttendance = null;
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
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

