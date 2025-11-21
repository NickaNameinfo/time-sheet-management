import 'package:flutter/foundation.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:logger/logger.dart';

class TimesheetProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();
  
  bool _isLoading = false;
  List<Map<String, dynamic>> _timesheets = [];
  String? _error;
  DateTime? _lastLoadTime;
  String? _lastLoadKey;
  static const Duration _minLoadInterval = Duration(seconds: 3);
  
  bool get isLoading => _isLoading;
  List<Map<String, dynamic>> get timesheets => _timesheets;
  String? get error => _error;
  
  Future<void> loadTimesheet({
    String? employeeId,
    String? startDate,
    String? endDate,
    bool forceRefresh = false,
  }) async {
    // Prevent rapid successive calls
    if (_isLoading) {
      _logger.d('Already loading timesheet, skipping...');
      return;
    }
    
    final loadKey = 'timesheet_${employeeId}_${startDate}_${endDate}';
    
    // Throttle requests - don't load if same request was recent (unless forced)
    if (!forceRefresh && 
        _lastLoadTime != null && 
        _lastLoadKey == loadKey &&
        DateTime.now().difference(_lastLoadTime!) < _minLoadInterval) {
      _logger.d('Timesheet loaded recently, skipping...');
      return;
    }
    
    _isLoading = true;
    _error = null;
    _lastLoadTime = DateTime.now();
    _lastLoadKey = loadKey;
    notifyListeners();
    
    try {
      // Try to load from cache first (only if not forcing refresh)
      bool hasCachedData = false;
      if (!forceRefresh) {
        final cacheKey = loadKey;
        final cached = await OfflineService.getCachedData(cacheKey);
        if (cached != null && cached['data'] != null) {
          _timesheets = List<Map<String, dynamic>>.from(cached['data']);
          hasCachedData = true;
          _isLoading = false;
          _error = null; // Clear any previous errors if we have cached data
          notifyListeners();
        }
      }
      
      // Try to load from API
      try {
        final results = await _apiService.getTimesheet(
          employeeId: employeeId,
          startDate: startDate,
          endDate: endDate,
        );
        
        _timesheets = results.map((item) => Map<String, dynamic>.from(item)).toList();
        
        // Cache the results
        final cacheKey = loadKey;
        await OfflineService.cacheData(
          key: cacheKey,
          data: {'data': _timesheets},
          expirySeconds: 300, // 5 minutes
        );
        
        _isLoading = false;
        _error = null;
        notifyListeners();
      } catch (apiError) {
        // If API fails but we have cached data, show cached data without error
        if (hasCachedData) {
          _logger.w('API error but showing cached data. Connection issue: ${apiError.toString().split('\n').first}');
          _isLoading = false;
          _error = 'Using cached data. Cannot connect to server.';
          notifyListeners();
        } else {
          // No cached data, show error
          final errorMessage = apiError.toString().contains('connection') 
              ? 'Cannot connect to server. Please check your connection and ensure the backend is running on port 8000.'
              : 'Failed to load timesheet. Please try again.';
          _logger.w('Error loading timesheet: ${errorMessage}');
          _error = errorMessage;
          _isLoading = false;
          notifyListeners();
        }
      }
    } catch (e) {
      _logger.e('Error loading timesheet: $e');
      // Only set error if we don't have any data to show
      if (_timesheets.isEmpty) {
        _error = 'Failed to load timesheet. Please check your connection.';
      } else {
        _error = null; // We have data, don't show error
      }
      _isLoading = false;
      notifyListeners();
    }
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

