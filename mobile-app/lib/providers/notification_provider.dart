import 'package:flutter/foundation.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/offline_service.dart';
import 'package:logger/logger.dart';

class NotificationProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();
  
  bool _isLoading = false;
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;
  String? _error;
  DateTime? _lastLoadTime;
  static const Duration _minLoadInterval = Duration(seconds: 5);
  
  bool get isLoading => _isLoading;
  List<Map<String, dynamic>> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  String? get error => _error;
  
  Future<void> loadNotifications({String? employeeId, bool forceRefresh = false}) async {
    // Prevent rapid successive calls
    if (_isLoading) {
      _logger.d('Already loading notifications, skipping...');
      return;
    }
    
    // Throttle requests - don't load if last load was recent (unless forced)
    if (!forceRefresh && 
        _lastLoadTime != null && 
        DateTime.now().difference(_lastLoadTime!) < _minLoadInterval) {
      _logger.d('Notifications loaded recently, skipping...');
      return;
    }
    
    _isLoading = true;
    _error = null;
    _lastLoadTime = DateTime.now();
    notifyListeners();
    
    try {
      // Try to load from cache first (only if not forcing refresh)
      if (!forceRefresh) {
        final cacheKey = 'notifications_$employeeId';
        final cached = await OfflineService.getCachedData(cacheKey);
        if (cached != null && cached['data'] != null) {
          _notifications = List<Map<String, dynamic>>.from(cached['data']);
          _updateUnreadCount();
          _isLoading = false;
          notifyListeners();
        }
      }
      
      // Load from API
      final results = await _apiService.getNotifications(employeeId: employeeId);
      
      _notifications = results.map((item) => Map<String, dynamic>.from(item)).toList();
      _updateUnreadCount();
      
      // Cache the results
      final cacheKey = 'notifications_$employeeId';
      await OfflineService.cacheData(
        key: cacheKey,
        data: {'data': _notifications},
        expirySeconds: 300, // 5 minutes
      );
      
      _isLoading = false;
      _error = null;
      notifyListeners();
    } catch (e) {
      _logger.e('Error loading notifications: $e');
      _error = 'Failed to load notifications';
      _isLoading = false;
      notifyListeners();
      
      // Don't retry on connection errors - user can manually refresh
      // This prevents infinite retry loops
    }
  }
  
  void _updateUnreadCount() {
    _unreadCount = _notifications.where((n) {
      return n['isRead'] == false || n['isRead'] == 0;
    }).length;
  }
  
  Future<void> markAsRead(String notificationId) async {
    // Update locally
    final index = _notifications.indexWhere((n) => n['id'] == notificationId);
    if (index != -1) {
      _notifications[index]['isRead'] = true;
      _updateUnreadCount();
      notifyListeners();
    }
    
    // TODO: Update on server
  }
  
  Future<void> markAllAsRead() async {
    // Update locally
    for (var notification in _notifications) {
      notification['isRead'] = true;
    }
    _updateUnreadCount();
    notifyListeners();
    
    // TODO: Update on server
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

