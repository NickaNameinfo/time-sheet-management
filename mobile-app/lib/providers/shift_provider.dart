import 'package:flutter/foundation.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:logger/logger.dart';

class ShiftProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();
  
  bool _isLoading = false;
  List<Map<String, dynamic>> _shifts = [];
  Map<String, dynamic>? _currentShift;
  String? _error;
  DateTime? _lastLoadTime;
  static const Duration _minLoadInterval = Duration(seconds: 5);
  
  bool get isLoading => _isLoading;
  List<Map<String, dynamic>> get shifts => _shifts;
  Map<String, dynamic>? get currentShift => _currentShift;
  String? get error => _error;
  
  Future<void> loadShifts({String? employeeId, bool forceRefresh = false}) async {
    // Prevent rapid successive calls
    if (_isLoading) {
      _logger.d('Already loading shifts, skipping...');
      return;
    }
    
    // Throttle requests - don't load if last load was recent (unless forced)
    if (!forceRefresh && 
        _lastLoadTime != null && 
        DateTime.now().difference(_lastLoadTime!) < _minLoadInterval) {
      _logger.d('Shifts loaded recently, skipping...');
      return;
    }
    
    _isLoading = true;
    _error = null;
    _lastLoadTime = DateTime.now();
    notifyListeners();
    
    try {
      // Try to load from cache first (only if not forcing refresh)
      if (!forceRefresh) {
        final cacheKey = 'shifts_$employeeId';
        final cached = await OfflineService.getCachedData(cacheKey);
        if (cached != null && cached['data'] != null) {
          _shifts = List<Map<String, dynamic>>.from(cached['data']);
          _updateCurrentShift();
          _isLoading = false;
          notifyListeners();
        }
      }
      
      // Load from API
      final results = await _apiService.getShiftAssignments(employeeId: employeeId);
      
      _shifts = results.map((item) => Map<String, dynamic>.from(item)).toList();
      _updateCurrentShift();
      
      // Cache the results
      final cacheKey = 'shifts_$employeeId';
      await OfflineService.cacheData(
        key: cacheKey,
        data: {'data': _shifts},
        expirySeconds: 3600, // 1 hour
      );
      
      _isLoading = false;
      _error = null;
      notifyListeners();
    } catch (e) {
      _logger.e('Error loading shifts: $e');
      _error = 'Failed to load shifts';
      _isLoading = false;
      notifyListeners();
      // Don't retry automatically - prevents infinite loops
    }
  }
  
  void _updateCurrentShift() {
    final now = DateTime.now();
    _currentShift = _shifts.firstWhere(
      (shift) {
        // Adjust based on your shift data structure
        // This is a placeholder logic
        return true; // Replace with actual shift matching logic
      },
      orElse: () => <String, dynamic>{},
    );
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

