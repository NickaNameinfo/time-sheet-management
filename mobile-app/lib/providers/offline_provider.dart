import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:logger/logger.dart';
import 'dart:async';

class OfflineProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();
  Timer? _syncTimer;
  
  bool _isOnline = true;
  bool _isSyncing = false;
  int _pendingCount = 0;
  
  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;
  int get pendingCount => _pendingCount;
  
  OfflineProvider() {
    _initConnectivityListener();
    _startSyncTimer();
    _checkPendingItems();
  }
  
  void _initConnectivityListener() {
    Connectivity().onConnectivityChanged.listen((ConnectivityResult result) {
      final wasOffline = !_isOnline;
      _isOnline = result != ConnectivityResult.none;
      
      if (wasOffline && _isOnline) {
        // Just came online, sync pending items
        syncPendingItems();
      }
      
      notifyListeners();
    });
  }
  
  void _startSyncTimer() {
    _syncTimer = Timer.periodic(
      Duration(seconds: AppConfig.syncIntervalSeconds),
      (_) => syncPendingItems(),
    );
  }
  
  Future<void> _checkPendingItems() async {
    final attendance = await OfflineService.getPendingAttendance();
    final leaves = await OfflineService.getPendingLeaves();
    _pendingCount = attendance.length + leaves.length;
    notifyListeners();
  }
  
  Future<void> syncPendingItems() async {
    if (!_isOnline || _isSyncing) return;
    
    _isSyncing = true;
    notifyListeners();
    
    try {
      // Sync attendance
      final attendanceItems = await OfflineService.getPendingAttendance();
      for (var item in attendanceItems) {
        try {
          if (item['action'] == 'clock_in') {
            await _apiService.clockIn(
              employeeId: item['data']['employeeId'],
              employeeName: item['data']['employeeName'],
              projectName: item['data']['projectName'],
              referenceNo: item['data']['referenceNo'],
              areaOfWork: item['data']['areaOfWork'],
            );
          } else if (item['action'] == 'clock_out') {
            await _apiService.clockOut(
              employeeId: item['data']['employeeId'],
              workDetailId: item['data']['workDetailId'],
              description: item['data']['description'],
            );
          }
          
          await OfflineService.markAttendanceSynced(item['id']);
        } catch (e) {
          _logger.e('Error syncing attendance ${item['id']}: $e');
          await OfflineService.incrementRetryCount(item['id']);
          
          // If retry count exceeds max, mark as failed
          if (item['retry_count'] >= AppConfig.maxRetryAttempts) {
            _logger.w('Max retries reached for attendance ${item['id']}');
          }
        }
      }
      
      // Sync leaves
      final leaveItems = await OfflineService.getPendingLeaves();
      for (var item in leaveItems) {
        try {
          await _apiService.applyLeave(
            employeeId: item['data']['employeeId'],
            employeeName: item['data']['employeeName'],
            leaveType: item['data']['leaveType'],
            leaveFrom: item['data']['leaveFrom'],
            leaveTo: item['data']['leaveTo'],
            reason: item['data']['reason'],
          );
          
          await OfflineService.markLeaveSynced(item['id']);
        } catch (e) {
          _logger.e('Error syncing leave ${item['id']}: $e');
          // Handle retry logic similar to attendance
        }
      }
      
      await _checkPendingItems();
    } catch (e) {
      _logger.e('Error during sync: $e');
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }
  
  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }
}

