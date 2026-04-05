import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/attendance_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/background_timer_service.dart';
import 'package:timesheet_mobile/services/notification_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timesheet_mobile/theme/app_brand_colors.dart';
import 'dart:ui'; // Added for FontFeature

class EmployeeHomeScreen extends StatefulWidget {
  const EmployeeHomeScreen({super.key});

  @override
  State<EmployeeHomeScreen> createState() => _EmployeeHomeScreenState();
}

class _EmployeeHomeScreenState extends State<EmployeeHomeScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<_LeaveBalanceCardData> _leaveBalanceCards = [];
  List<dynamic> _timesheetData = [];
  int _selectedWeek = 0; // 0 means use current week
  
  // Today's attendance
  DateTime? _todayCheckIn;
  DateTime? _todayCheckOut;
  bool _isClockedIn = false;
  String? _workDetailId;
  double _todayWorkingHours = 0.0;
  String _todayTimeFormatted = "0:00:00";
  Timer? _hoursUpdateTimer;
  
  // Clock in/out dialogs
  bool _showClockInDialog = false;
  bool _showClockOutDialog = false;
  bool _showOpenReminderPopup = false; // show reminder popup once when app opens
  String _selectedProject = '';
  String _referenceNo = '';
  String _selectedAreaOfWork = '';
  List<dynamic> _projects = [];
  List<dynamic> _areaOfWorkList = [];
  List<dynamic> _assignedProjectPlans = [];
  bool _loadingProjectPlans = false;
  final TextEditingController _referenceNoController = TextEditingController();
  
  @override
  void dispose() {
    _hoursUpdateTimer?.cancel();
    _referenceNoController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Initialize to current week
    _selectedWeek = _getCurrentWeekNumber();
    _loadData();
    _checkTodayAttendance().then((_) {
      // Start timer after checking attendance
      _startHoursTimer();
      // Start background timer if clocked in
      if (_isClockedIn) {
        BackgroundTimerService.startBackgroundTimer();
      }
      // Show reminder popup once when app opens (after a short delay so UI is ready)
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Future.delayed(const Duration(milliseconds: 600), () {
          if (mounted && !_showOpenReminderPopup) _showReminderPopupIfNeeded();
        });
      });
    });
    _loadProjectsAndAreaOfWork();
    _loadAssignedProjectPlans();
    // Schedule clock-in and shift reminders every time home is shown (so they work after app reopen)
    WidgetsBinding.instance.addPostFrameCallback((_) => _scheduleReminders());
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await auth.refreshUserFromApi();
      if (mounted) setState(() {});
    });
  }

  /// Show a one-time popup reminder when app opens: clock-in reminder or "all set".
  void _showReminderPopupIfNeeded() {
    if (!mounted || _showOpenReminderPopup) return;
    _showOpenReminderPopup = true;
    final isClockedIn = _isClockedIn;
    final title = isClockedIn ? 'Reminder' : 'Reminder';
    final message = isClockedIn
        ? 'You\'re clocked in. Don\'t forget to clock out when you finish work.'
        : 'Don\'t forget to clock in today!';
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.notifications_active_rounded, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Later'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              if (!isClockedIn && mounted) setState(() => _showClockInDialog = true);
            },
            child: Text(isClockedIn ? 'OK' : 'Clock in now'),
          ),
        ],
      ),
    );
  }

  Future<void> _scheduleReminders() async {
    try {
      // Request permission so scheduled reminders can fire when app is closed
      await NotificationService.requestReminderPermissions();
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final employeeId = AppConfig.employeeDbIdForApi(user);
      await NotificationService.scheduleAllReminders(employeeId: employeeId);
    } catch (e) {
      debugPrint('Schedule reminders: $e');
    }
  }

  Future<void> _loadProjectsAndAreaOfWork() async {
    try {
      // Get current user ID to fetch assigned projects from project plans
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final employeeId = AppConfig.employeeDbIdForApi(user);
      
      final areaOfWork = await _apiService.getAreaOfWork();
      
      // Fetch assigned projects from project plans (NEW: Use project plans API)
      List<dynamic> assignedProjects = [];
      if (employeeId != null && employeeId.isNotEmpty) {
        try {
          // Use the new API endpoint to get assigned projects with allotted hours
          assignedProjects = await _apiService.getEmployeeAssignedProjects(employeeId: employeeId);
        } catch (e) {
          debugPrint('Error fetching assigned projects from project plans: $e');
          // Fallback: try to get all projects if the new API fails
          try {
            final allProjects = await _apiService.getProjects();
            assignedProjects = allProjects ?? [];
          } catch (e2) {
            debugPrint('Error fetching all projects: $e2');
          }
        }
      } else {
        // If no employeeId, try to get all projects as fallback
        try {
          final allProjects = await _apiService.getProjects();
          assignedProjects = allProjects ?? [];
        } catch (e) {
          debugPrint('Error fetching projects: $e');
        }
      }
      
      setState(() {
        _projects = assignedProjects;
        _areaOfWorkList = areaOfWork;
      });
    } catch (e) {
      debugPrint('Error loading projects and area of work: $e');
    }
  }

  Future<void> _loadAssignedProjectPlans() async {
    setState(() => _loadingProjectPlans = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final employeeId = AppConfig.employeeDbIdForApi(user);
      
      if (employeeId != null && employeeId.isNotEmpty) {
        try {
          final projectPlans = await _apiService.getEmployeeAssignedProjects(employeeId: employeeId);
          setState(() {
            _assignedProjectPlans = projectPlans;
            _loadingProjectPlans = false;
          });
        } catch (e) {
          debugPrint('Error fetching assigned project plans: $e');
          setState(() {
            _assignedProjectPlans = [];
            _loadingProjectPlans = false;
          });
        }
      } else {
        setState(() {
          _assignedProjectPlans = [];
          _loadingProjectPlans = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading assigned project plans: $e');
      setState(() => _loadingProjectPlans = false);
    }
  }

  void _startHoursTimer() {
    _hoursUpdateTimer?.cancel();
    _hoursUpdateTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _isClockedIn && _todayCheckIn != null) {
        setState(() {
          _calculateTodayHours();
        });
        // Auto-update time management screen every 5 minutes
        if (timer.tick % 300 == 0) {
          _updateTimeManagementScreen();
        }
      }
    });
  }

  Future<void> _checkTodayAttendance() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user);
      if (employeeId == null) return;
      
      // First check SharedPreferences for saved clock-in state (Most accurate for current session)
      final prefs = await SharedPreferences.getInstance();
      final savedClockInTime = prefs.getString('clock_in_time');
      final savedWorkDetailId = prefs.getString('work_detail_id');
      final isClockedInSaved = prefs.getBool('is_clocked_in') ?? false;
      
      if (savedClockInTime != null && isClockedInSaved) {
        final clockInTime = DateTime.tryParse(savedClockInTime);
        if (clockInTime != null) {
          // Convert to Local time for consistent calculation against DateTime.now()
          final localClockInTime = clockInTime.isUtc ? clockInTime.toLocal() : clockInTime;
          setState(() {
            _todayCheckIn = localClockInTime;
            _isClockedIn = true;
            _workDetailId = savedWorkDetailId;
            _calculateTodayHours();
          });
          // Start background timer if not already running
          await BackgroundTimerService.startBackgroundTimer();
          return;
        }
      }
      
      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      
      // Get today's work details
      final workDetails = await _apiService.getWorkDetails(employeeId: employeeId);
      final todayWork = workDetails.firstWhere(
        (w) {
          final workDate = w['date']?.toString() ?? 
                         w['workDate']?.toString() ?? 
                         w['logDate']?.toString() ?? '';
          return workDate.startsWith(today);
        },
        orElse: () => <String, dynamic>{},
      );

      if (todayWork.isNotEmpty) {
        final workDetailId = todayWork['id']?.toString() ?? 
                         todayWork['workDetailId']?.toString();
        
        final clockInStr = todayWork['clockInTime']?.toString() ?? 
                         todayWork['clockIn']?.toString() ??
                         todayWork['inTime']?.toString() ??
                         todayWork['sentDate']?.toString();
        final clockOutStr = todayWork['clockOutTime']?.toString() ?? 
                          todayWork['clockOut']?.toString() ??
                          todayWork['outTime']?.toString() ??
                          todayWork['approvedDate']?.toString();
        
        final isClockedIn = clockInStr != null && clockInStr.isNotEmpty && 
                           (clockOutStr == null || clockOutStr.isEmpty);
        
        setState(() {
          _workDetailId = workDetailId;
          
          if (clockInStr != null && clockInStr.isNotEmpty) {
            DateTime? parsedClockIn = DateTime.tryParse(clockInStr);
            
            // Handle MySQL/Backend formats that might not be standard ISO
            if (parsedClockIn == null) {
              try {
                final parts = clockInStr.split(' ');
                if (parts.length == 2) {
                  final datePart = parts[0].split('-');
                  final timePart = parts[1].split(':');
                  if (datePart.length == 3 && timePart.length >= 2) {
                    parsedClockIn = DateTime(
                      int.parse(datePart[0]),
                      int.parse(datePart[1]),
                      int.parse(datePart[2]),
                      int.parse(timePart[0]),
                      int.parse(timePart[1]),
                      timePart.length > 2 ? int.parse(timePart[2]) : 0,
                    );
                  }
                }
              } catch (e) {
                debugPrint('Error parsing clock-in time: $e');
              }
            } else if (parsedClockIn.isUtc) {
              // If API returns UTC, convert to Local so the timer matches device time
              parsedClockIn = parsedClockIn.toLocal();
            }

            _todayCheckIn = parsedClockIn;
            _isClockedIn = isClockedIn;
          }
          
          if (clockOutStr != null && clockOutStr.isNotEmpty) {
            DateTime? parsedOut = DateTime.tryParse(clockOutStr);
            if (parsedOut != null && parsedOut.isUtc) {
               parsedOut = parsedOut.toLocal();
            }
            _todayCheckOut = parsedOut;
            _isClockedIn = false;
          }
          
          _calculateTodayHours();
        });
        
        // Save state if clocked in
        if (isClockedIn && clockInStr != null) {
          await prefs.setBool('is_clocked_in', true);
          await prefs.setString('clock_in_time', clockInStr);
          if (workDetailId != null) {
            await prefs.setString('work_detail_id', workDetailId);
          }
          await BackgroundTimerService.startBackgroundTimer();
        }
      } 
    } catch (e) {
      // Silently fail
    }
  }

  void _calculateTodayHours() {
    if (_todayCheckIn == null) {
      setState(() {
        _todayWorkingHours = 0.0;
        _todayTimeFormatted = "0:00:00";
      });
      return;
    }

    DateTime endTime;
    
    // If we have a checkout time, use that. 
    // If not, and we are clocked in, use NOW.
    if (_todayCheckOut != null) {
      endTime = _todayCheckOut!;
    } else if (_isClockedIn) {
      endTime = DateTime.now();
    } else {
      return;
    }

    // Determine the difference
    final duration = endTime.difference(_todayCheckIn!);
    
    // Safety check for negative duration (if device time is changed manually)
    final totalSeconds = duration.isNegative ? 0 : duration.inSeconds;
    
    // Calculate decimal hours (e.g. 0.42)
    final hours = totalSeconds / 3600.0; 

    setState(() {
      _todayWorkingHours = hours;
      _todayTimeFormatted = _formatTime(totalSeconds);
    });
  }

  String _formatTime(int totalSeconds) {
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final seconds = totalSeconds % 60;
    return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _handleCheckIn() async {
    // Validate that at least project or reference number is provided
    if (_selectedProject.isEmpty && _referenceNo.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a project or enter reference number'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user) ?? '';
      if (employeeId.isEmpty) return;

      String refNo = _referenceNo.trim();
      String? projectName;
      String? projectNo;
      String? taskNo;
      String? variation;
      String? subDivision;
      String? subDivisionList;
      String? allotatedHours;
      String? desciplineCode;
      String? designation;
      String? tlName;
      
      Map<String, dynamic> selectedProjectData = {};
      
      if (refNo.isNotEmpty) {
        try {
          selectedProjectData = _projects.firstWhere(
            (p) => p['referenceNo']?.toString() == refNo,
            orElse: () => {},
          );
        } catch (e) {}
      }
      
      if (selectedProjectData.isEmpty && _selectedProject.isNotEmpty) {
        try {
          selectedProjectData = _projects.firstWhere(
            (p) => p['projectName']?.toString() == _selectedProject,
            orElse: () => {},
          );
        } catch (e) {}
      }
      
      if (selectedProjectData.isNotEmpty) {
        refNo = selectedProjectData['referenceNo']?.toString() ?? refNo;
        projectName = selectedProjectData['projectName']?.toString() ?? _selectedProject;
        projectNo = selectedProjectData['projectNo']?.toString();
        taskNo = selectedProjectData['taskJobNo']?.toString() ?? selectedProjectData['taskNo']?.toString();
        variation = selectedProjectData['variation']?.toString();
        subDivision = selectedProjectData['subDivision']?.toString();
        subDivisionList = selectedProjectData['subDivision']?.toString();
        allotatedHours = selectedProjectData['allotatedHours']?.toString();
        desciplineCode = selectedProjectData['desciplineCode']?.toString();
        designation = selectedProjectData['designation']?.toString();
        tlName = selectedProjectData['tlName']?.toString();
      } else {
        projectName = _selectedProject;
      }

      var empName = AppConfig.displayNameForUser(user);
      if (empName == 'Employee') {
        empName = user['employeeName']?.toString().trim() ??
            user['name']?.toString().trim() ??
            user['userName']?.toString().trim() ??
            '';
      }
      if (empName.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Employee name is missing. Please contact administrator.'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      final Map<String, dynamic> projectDetails = {};
      if (selectedProjectData.isNotEmpty) {
        projectDetails['referenceNo'] = refNo.isNotEmpty ? refNo.trim() : '';
        projectDetails['projectName'] = (projectName?.isNotEmpty ?? false) ? projectName!.trim() : (_selectedProject.isNotEmpty ? _selectedProject.trim() : '');
        if (projectNo != null && projectNo!.isNotEmpty) projectDetails['projectNo'] = projectNo!.trim();
        if (taskNo != null && taskNo!.isNotEmpty) projectDetails['taskNo'] = taskNo!.trim();
        if (variation != null && variation!.isNotEmpty) projectDetails['variation'] = variation!.trim();
        if (subDivision != null && subDivision!.isNotEmpty) projectDetails['subDivision'] = subDivision!.trim();
        if (subDivisionList != null && subDivisionList!.isNotEmpty) projectDetails['subDivisionList'] = subDivisionList!.trim();
        if (allotatedHours != null && allotatedHours!.isNotEmpty) projectDetails['allotatedHours'] = allotatedHours!.trim();
        if (desciplineCode != null && desciplineCode!.isNotEmpty) projectDetails['desciplineCode'] = desciplineCode!.trim();
        if (designation != null && designation!.isNotEmpty) projectDetails['designation'] = designation!.trim();
      }

      final result = await _apiService.clockIn(
        employeeId: employeeId,
        employeeName: empName,
        employeeNo: employeeId,
        projectName: projectDetails['projectName'] ?? ((projectName?.isNotEmpty ?? false) ? projectName!.trim() : (_selectedProject.isNotEmpty ? _selectedProject.trim() : '')),
        referenceNo: projectDetails['referenceNo'] ?? (refNo.isNotEmpty ? refNo.trim() : ''),
        areaOfWork: _selectedAreaOfWork.isNotEmpty ? _selectedAreaOfWork.trim() : '',
        projectNo: projectDetails['projectNo'],
        taskNo: projectDetails['taskNo'],
        variation: projectDetails['variation'],
        subDivision: projectDetails['subDivision'],
        subDivisionList: projectDetails['subDivisionList'],
        allotatedHours: projectDetails['allotatedHours'],
        desciplineCode: projectDetails['desciplineCode'],
        designation: projectDetails['designation'],
        tlName: tlName,
      );

      if (mounted) {
        final workDetailId = result['id']?.toString() ?? 
                           result['workDetailId']?.toString();
        
        // IMPORTANT: Use DateTime.now() (local time) for immediate UI feedback
        final DateTime checkInDateTime = DateTime.now();

        setState(() {
          _workDetailId = workDetailId;
          _todayCheckIn = checkInDateTime;
          _isClockedIn = true;
          _todayCheckOut = null;
          _showClockInDialog = false;
          _selectedProject = '';
          _referenceNo = '';
          _referenceNoController.clear();
          _selectedAreaOfWork = '';
          _todayWorkingHours = 0.0;
          _todayTimeFormatted = "0:00:00";
        });
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('is_clocked_in', true);
        await prefs.setString('clock_in_time', checkInDateTime.toIso8601String());
        if (workDetailId != null) {
          await prefs.setString('work_detail_id', workDetailId);
        }
        
        await BackgroundTimerService.startBackgroundTimer();
        
        _calculateTodayHours();
        _startHoursTimer();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Checked in at ${DateFormat('HH:mm').format(_todayCheckIn!)}'),
            backgroundColor: Colors.green,
          ),
        );
        _checkTodayAttendance();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleCheckOut() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user) ?? '';
      if (employeeId.isEmpty) return;

      String? workDetailId = _workDetailId;
      if (workDetailId == null || workDetailId.isEmpty) {
        try {
          final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
          final workDetails = await _apiService.getWorkDetails(employeeId: employeeId);
          final todayWork = workDetails.firstWhere(
            (w) {
              final workDate = w['date']?.toString() ?? 
                             w['workDate']?.toString() ?? 
                             w['logDate']?.toString() ?? 
                             w['sentDate']?.toString() ?? '';
              return workDate.startsWith(today);
            },
            orElse: () => <String, dynamic>{},
          );
          
          if (todayWork.isNotEmpty) {
            workDetailId = todayWork['id']?.toString() ?? 
                         todayWork['workDetailId']?.toString();
          }
        } catch (e) {}
      }

      if (workDetailId == null || workDetailId.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No active clock-in found. Please clock in first.'),
              backgroundColor: Colors.red,
            ),
          );
          setState(() {
            _showClockOutDialog = false;
          });
        }
        return;
      }

      // Send UTC time to backend for consistent calculation
      final result = await _apiService.clockOut(
        employeeId: employeeId,
        workDetailId: workDetailId,
        clockOutTime: DateTime.now().toUtc().toIso8601String(),
      );

      if (mounted) {
        final totalHours = result['totalHours']?.toString() ?? 
                          result['hours']?.toString() ?? 
                          _todayWorkingHours.toStringAsFixed(2);
        
        final clockOutTime = result['clockOutTime']?.toString() ?? 
                            result['clockOut']?.toString() ??
                            result['approvedDate']?.toString();
        
        DateTime checkOutDateTime = DateTime.now();
        if (clockOutTime != null && clockOutTime.isNotEmpty) {
          final parsed = DateTime.tryParse(clockOutTime);
          if (parsed != null) {
            checkOutDateTime = parsed.isUtc ? parsed.toLocal() : parsed;
          }
        }

        setState(() {
          _todayCheckOut = checkOutDateTime;
          _isClockedIn = false;
          _showClockOutDialog = false;
          _workDetailId = null;
        });
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('is_clocked_in');
        await prefs.remove('clock_in_time');
        await prefs.remove('work_detail_id');
        await prefs.remove('current_working_hours');
        
        await BackgroundTimerService.stopBackgroundTimer();
        
        _calculateTodayHours();
        _hoursUpdateTimer?.cancel();
        _updateTimeManagementScreen();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Clocked out successfully. Total hours: $totalHours hours'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
        _checkTodayAttendance();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _updateTimeManagementScreen() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null || _todayCheckIn == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user) ?? '';
      if (employeeId.isEmpty) return;

      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      
      final workDetails = await _apiService.getWorkDetails(employeeId: employeeId);
      final todayWork = workDetails.firstWhere(
        (w) {
          final workDate = w['date']?.toString() ?? 
                         w['workDate']?.toString() ?? 
                         w['logDate']?.toString() ?? 
                         w['sentDate']?.toString() ?? '';
          return workDate.startsWith(today);
        },
        orElse: () => {},
      );

      if (todayWork.isNotEmpty && todayWork['id'] != null) {
        await _apiService.updateWorkDetails(todayWork['id'], {
          'hours': _todayWorkingHours,
          'totalHours': _todayWorkingHours,
        });
      }
    } catch (e) {
      debugPrint('Update time management screen error: $e');
    }
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user);
      final currentYear = DateTime.now().year;

      // Load leave balance
      final leaveBalance = await _apiService.getLeaveBalance(
        employeeId: employeeId,
        year: currentYear,
      );
      
      // Load comp-off details
      final compOffDetails = await _apiService.getCompOffDetails(employeeId: employeeId);
      
      double toD(dynamic v) {
        if (v == null) return 0;
        if (v is num) return v.toDouble();
        return double.tryParse(v.toString()) ?? 0;
      }

      String normType(String raw) {
        final t = raw.toLowerCase().trim();
        if (t == 'annual' || t == 'earned') return 'annual';
        if (t == 'casual') return 'casual';
        if (t == 'sick') return 'sick';
        if (t == 'emergency') return 'emergency';
        return t;
      }

      final byType = <String, Map<String, dynamic>>{};
      for (final item in leaveBalance) {
        final key = normType((item['leave_type'] ?? item['leaveType'] ?? '').toString());
        if (key.isNotEmpty) byType[key] = item;
      }

      double approvedCompOff = 0;
      if (compOffDetails.isNotEmpty) {
        approvedCompOff = compOffDetails
            .where((item) => (item['leaveStatus'] ?? '').toString().toLowerCase() == 'approved')
            .fold<double>(0, (sum, item) => sum + ((item['eligibility'] ?? 0).toDouble() / 9));
      }

      final leaveDetails = await _apiService.getLeaveDetails(employeeId: employeeId);
      final usedCompOff = leaveDetails
          .where((item) =>
              (item['leaveType'] ?? '').toString() == 'Comp-off' &&
              (item['leaveStatus'] ?? '').toString().toLowerCase() == 'approved')
          .fold<double>(0, (sum, item) => sum + toD(item['leaveHours']));

      final compOffBalance = (approvedCompOff - usedCompOff).clamp(0.0, double.infinity);

      _LeaveBalanceCardData cardFor(String typeKey, String label) {
        final item = byType[typeKey];
        final bal = toD(item?['balance']);
        final acc = toD(item?['accrued']);
        final used = toD(item?['used']);
        final accruedEff = acc > 0 ? acc : (bal + used);
        return _LeaveBalanceCardData(label: label, balance: bal, accrued: accruedEff, used: used);
      }

      final cards = <_LeaveBalanceCardData>[
        cardFor('annual', 'ANNUAL'),
        cardFor('casual', 'CASUAL'),
        cardFor('emergency', 'EMERGENCY'),
        cardFor('sick', 'SICK'),
        _LeaveBalanceCardData(
          label: 'COMP-OFF',
          balance: compOffBalance,
          accrued: approvedCompOff,
          used: usedCompOff,
        ),
      ];

      setState(() {
        _leaveBalanceCards = cards;
      });

      await _loadTimesheet();
      _checkTodayAttendance();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadTimesheet() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user);
      
      final now = DateTime.now();
      final startOfYear = DateTime(now.year, 1, 1);
      final daysSinceStart = now.difference(startOfYear).inDays;
      final weekNumber = (daysSinceStart / 7).floor() + 1;
      final selectedWeek = _selectedWeek > 0 ? _selectedWeek : weekNumber;
      
      final weekStart = startOfYear.add(Duration(days: (selectedWeek - 1) * 7));
      final dates = List.generate(7, (i) => weekStart.add(Duration(days: i)));
      
      final logDates = dates.map((d) => DateFormat('yyyy-MM-dd').format(d)).toList();
      
      final result = await _apiService.filterTimeSheet({
        'userId': int.tryParse(employeeId ?? ''),
        'logDates': logDates,
      });

      setState(() {
        _timesheetData = result;
      });
    } catch (e) {
      // Silently fail for timesheet
    }
  }

  int _getCurrentWeekNumber() {
    final now = DateTime.now();
    final startOfYear = DateTime(now.year, 1, 1);
    final daysSinceStart = now.difference(startOfYear).inDays;
    final dayOfWeek = startOfYear.weekday % 7; 
    return ((daysSinceStart + dayOfWeek + 1) / 7).ceil();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Stack(
      children: [
          RefreshIndicator(
          onRefresh: () async {
            await context.read<AuthProvider>().refreshUserFromApi();
            await _loadData();
            await _checkTodayAttendance();
            await _loadAssignedProjectPlans();
          },
          child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: AppBrandColors.heroGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppBrandColors.blue.withOpacity(0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Consumer<AuthProvider>(
                builder: (context, authProvider, _) {
                  final user = authProvider.user;
                  final displayName = AppConfig.displayNameForUser(user);
                  final todayStr = DateFormat.yMMMEd().format(DateTime.now());
                  final photoUrl = AppConfig.employeePhotoUrlFromFilename(user?['employeeImage']);
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Welcome Back',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.white.withOpacity(0.9),
                                fontWeight: FontWeight.w500,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              todayStr,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withOpacity(0.85),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              displayName,
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 0.5,
                                height: 1.2,
                              ),
                            ),
                            if (user?['EMPID'] != null || user?['employeeId'] != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                'ID: ${user?['EMPID'] ?? user?['employeeId'] ?? ''}',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white.withOpacity(0.8),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: photoUrl != null
                            ? CachedNetworkImage(
                                imageUrl: photoUrl,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => const Center(
                                  child: SizedBox(
                                    width: 28,
                                    height: 28,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                errorWidget: (_, __, ___) => const Icon(
                                  Icons.person_rounded,
                                  size: 48,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(
                                Icons.person_rounded,
                                size: 48,
                                color: Colors.white,
                              ),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
            
            // Assigned Project Plans Section
            if (_assignedProjectPlans.isNotEmpty) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Assigned Project Plans',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  if (_loadingProjectPlans)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              ..._assignedProjectPlans.map((plan) => _buildProjectPlanCard(plan)).toList(),
              const SizedBox(height: 24),
            ],
            
            // Check-In/Check-Out Card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Today\'s Attendance',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[800],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _isClockedIn ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: _isClockedIn ? Colors.green : Colors.grey,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _isClockedIn ? 'Clocked In' : 'Clocked Out',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: _isClockedIn ? Colors.green : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Check-In/Check-Out Times
                    Row(
                      children: [
                        Expanded(
                          child: _buildTimeInfo(
                            'Check-In',
                            _todayCheckIn != null ? DateFormat('HH:mm').format(_todayCheckIn!) : '--:--',
                            Icons.login,
                            _todayCheckIn != null ? Colors.green : Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTimeInfo(
                            'Check-Out',
                            _todayCheckOut != null ? DateFormat('HH:mm').format(_todayCheckOut!) : '--:--',
                            Icons.logout,
                            _todayCheckOut != null ? Colors.orange : Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Total Hours Display
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: _todayWorkingHours > 0
                              ? [Colors.green.withOpacity(0.1), Colors.green.withOpacity(0.05)]
                              : [Colors.grey.withOpacity(0.1), Colors.grey.withOpacity(0.05)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _todayWorkingHours > 0 ? Colors.green.withOpacity(0.3) : Colors.grey.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Today\'s Hours',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                size: 28,
                                color: _todayWorkingHours > 0 ? Colors.green : Colors.grey,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                _todayTimeFormatted,
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: _todayWorkingHours > 0 ? Colors.green : Colors.grey,
                                  fontFeatures: [const FontFeature.tabularFigures()],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            // FIXED: Show Minutes (e.g., "25m") instead of Decimal Hours (e.g., "0.42h")
                            '(${(_todayWorkingHours * 60).toStringAsFixed(0)}m)',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Check-In/Check-Out Button
                    SizedBox(
                      width: double.infinity,
                      child: _isClockedIn
                          ? ElevatedButton.icon(
                              onPressed: () async {
                                if (_workDetailId == null || _workDetailId!.isEmpty) {
                                  try {
                                    final authProvider = Provider.of<AuthProvider>(context, listen: false);
                                    final user = authProvider.user;
                                    if (user != null) {
                                      final employeeId = AppConfig.employeeDbIdForApi(user) ?? '';
                                      if (employeeId.isNotEmpty) {
                                        final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
                                        final workDetails = await _apiService.getWorkDetails(employeeId: employeeId);
                                        final todayWork = workDetails.firstWhere(
                                          (w) {
                                            final workDate = w['date']?.toString() ?? 
                                                           w['workDate']?.toString() ?? 
                                                           w['logDate']?.toString() ?? 
                                                           w['sentDate']?.toString() ?? '';
                                            return workDate.startsWith(today);
                                          },
                                          orElse: () => <String, dynamic>{},
                                        );
                                        if (todayWork.isNotEmpty) {
                                          setState(() {
                                            _workDetailId = todayWork['id']?.toString() ?? 
                                                          todayWork['workDetailId']?.toString();
                                            _showClockOutDialog = true;
                                          });
                                          return;
                                        }
                                      }
                                    }
                                  } catch (e) {}
                                }
                                
                                if (_workDetailId == null || _workDetailId!.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('No active clock-in found. Please clock in first.'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }
                                
                                setState(() => _showClockOutDialog = true);
                              },
                              icon: const Icon(Icons.logout, size: 20),
                              label: const Text(
                                'Check Out',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 2,
                              ),
                            )
                          : ElevatedButton.icon(
                              onPressed: () => setState(() => _showClockInDialog = true),
                              icon: const Icon(Icons.login, size: 20),
                              label: const Text(
                                'Check In',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 2,
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Leave Balance — horizontal gradient cards (annual, casual, emergency, sick, comp-off)
            if (_leaveBalanceCards.isNotEmpty) ...[
              const Text(
                'Leave Balance',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 172,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  clipBehavior: Clip.none,
                  itemCount: _leaveBalanceCards.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    return SizedBox(
                      width: 152,
                      child: _buildGradientLeaveCard(_leaveBalanceCards[index]),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Timesheet Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Time Sheet',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        DropdownButton<int>(
                          value: _selectedWeek > 0 ? _selectedWeek : _getCurrentWeekNumber(),
                          items: List.generate(52, (i) => i + 1).map((week) {
                            return DropdownMenuItem(
                              value: week,
                              child: Text('Week $week'),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() {
                                _selectedWeek = value;
                              });
                              _loadTimesheet();
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildTimesheetTable(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
        ),
        if (_showClockInDialog) _buildClockInDialog(),
        if (_showClockOutDialog) _buildClockOutDialog(),
      ],
    );
  }

  Widget _buildTimeInfo(String label, String time, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            time,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradientLeaveCard(_LeaveBalanceCardData data) {
    final maxRef = data.accrued > 0 ? data.accrued : (data.balance + data.used);
    final progress = maxRef > 0 ? (data.balance / maxRef).clamp(0.0, 1.0) : (data.balance > 0 ? 1.0 : 0.0);

    return Material(
      elevation: 4,
      shadowColor: AppBrandColors.blue.withValues(alpha: 0.28),
      borderRadius: BorderRadius.circular(16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [AppBrandColors.blue, AppBrandColors.green],
                ),
              ),
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.22),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.event_available_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          data.label == 'COMP-OFF' ? 'COMP-OFF' : '${data.label} Leave',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: 0.6,
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    data.balance.toStringAsFixed(2),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.05,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 5,
                      backgroundColor: Colors.white.withValues(alpha: 0.22),
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white.withValues(alpha: 0.55)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Accrued: ${data.accrued.toStringAsFixed(2)} | Used: ${data.used.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Colors.white.withValues(alpha: 0.9),
                      letterSpacing: 0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Positioned(
              right: -18,
              top: -18,
              child: IgnorePointer(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimesheetTable() {
    if (_timesheetData.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: Text('No timesheet data available')),
      );
    }

    final Map<String, Map<String, List<String>>> dateWiseData = {};
    
    for (var item in _timesheetData) {
      final formattedDate = item['FormattedLogDate']?.toString();
      if (formattedDate == null) continue;
      
      final date = formattedDate.length >= 10 ? formattedDate.substring(0, 10) : '';
      final time = formattedDate.length >= 16 ? formattedDate.substring(11, 16) : '';
      
      if (date.isEmpty || time.isEmpty) continue;
      
      if (!dateWiseData.containsKey(date)) {
        dateWiseData[date] = {'IN': [], 'OUT': []};
      }
      
      final hour = int.tryParse(time.split(':')[0]) ?? 0;
      if (hour < 12) {
        dateWiseData[date]!['IN']!.add(time);
      } else {
        dateWiseData[date]!['OUT']!.add(time);
      }
    }

    final now = DateTime.now();
    final startOfYear = DateTime(now.year, 1, 1);
    final selectedWeek = _selectedWeek > 0 ? _selectedWeek : _getCurrentWeekNumber();
    final weekStart = startOfYear.add(Duration(days: (selectedWeek - 1) * 7));
    final dates = List.generate(7, (i) => weekStart.add(Duration(days: i)));
    final weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columns: [
          const DataColumn(label: Text('Day')),
          ...dates.map((date) {
            final dateStr = DateFormat('yyyy-MM-dd').format(date);
            final dayIndex = dates.indexOf(date);
            return DataColumn(
              label: Text('${weekDays[dayIndex]}\n${DateFormat('MM/dd').format(date)}'),
            );
          }),
        ],
        rows: [
          DataRow(
            cells: [
              const DataCell(Text('IN / OUT')),
              ...dates.map((date) {
                final dateStr = DateFormat('yyyy-MM-dd').format(date);
                final dateData = dateWiseData[dateStr];
                final inTime = dateData?['IN']?.isNotEmpty == true 
                    ? dateData!['IN']!.first 
                    : 'NP';
                final outTime = dateData?['OUT']?.isNotEmpty == true 
                    ? dateData!['OUT']!.last 
                    : 'NP';
                return DataCell(Text('$inTime / $outTime'));
              }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildClockInDialog() {
    if (_selectedProject.isNotEmpty && !_projects.any((p) => p['projectName']?.toString() == _selectedProject)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() => _selectedProject = '');
      });
    }
    if (_selectedAreaOfWork.isNotEmpty && !_areaOfWorkList.any((a) => a['areaofwork']?.toString() == _selectedAreaOfWork)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() => _selectedAreaOfWork = '');
      });
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Clock In',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => setState(() => _showClockInDialog = false),
                ),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedProject.isEmpty || !_projects.any((p) => p['projectName']?.toString() == _selectedProject)
                  ? null
                  : _selectedProject,
              decoration: const InputDecoration(
                labelText: 'Project Name (Optional)',
                border: OutlineInputBorder(),
                helperText: 'Showing only assigned projects from project plans',
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('None')),
                ..._projects
                    .where((project) => project['projectName']?.toString().isNotEmpty == true)
                    .map((project) {
                      final projectName = project['projectName']?.toString() ?? '';
                      final allottedHours = project['allotatedHours']?.toString() ?? 
                                           project['allottedHours']?.toString() ??
                                           project['allotted_hours']?.toString();
                      final displayText = allottedHours != null && allottedHours.isNotEmpty
                          ? '$projectName (${allottedHours} hrs)'
                          : projectName;
                      return DropdownMenuItem(
                        value: projectName,
                        child: Text(displayText),
                      );
                    })
                    .toList(),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedProject = value ?? '';
                  if (value != null && value.isNotEmpty) {
                    final selectedProjectData = _projects.firstWhere(
                      (p) => p['projectName']?.toString() == value,
                      orElse: () => {},
                    );
                    if (selectedProjectData.isNotEmpty && selectedProjectData['referenceNo'] != null) {
                      _referenceNo = selectedProjectData['referenceNo'].toString();
                      _referenceNoController.text = _referenceNo;
                    }
                  } else {
                    _referenceNo = '';
                    _referenceNoController.clear();
                  }
                });
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _referenceNoController,
              decoration: const InputDecoration(
                labelText: 'Reference Number (Optional)',
                border: OutlineInputBorder(),
              ),
              onChanged: (value) => setState(() => _referenceNo = value),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedAreaOfWork.isEmpty || 
                      !_areaOfWorkList.any((area) => area['areaofwork']?.toString() == _selectedAreaOfWork)
                  ? null
                  : _selectedAreaOfWork,
              decoration: const InputDecoration(
                labelText: 'Area of Work (Optional)',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('None')),
                ..._areaOfWorkList
                    .where((area) => area['areaofwork']?.toString().isNotEmpty == true)
                    .map((area) => area['areaofwork']?.toString() ?? '')
                    .toSet()
                    .map((areaName) {
                      return DropdownMenuItem(
                        value: areaName,
                        child: Text(areaName),
                      );
                    })
                    .toList(),
              ],
              onChanged: (value) => setState(() => _selectedAreaOfWork = value ?? ''),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _showClockInDialog = false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _handleCheckIn,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Clock In'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClockOutDialog() {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Clock Out',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => setState(() => _showClockOutDialog = false),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_todayCheckIn != null) ...[
              _buildInfoRow('Clock In Time', DateFormat('yyyy-MM-dd HH:mm:ss').format(_todayCheckIn!)),
              const SizedBox(height: 12),
            ],
            _buildInfoRow('Current Time', DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now())),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  const Text(
                    'Total Hours',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _todayTimeFormatted,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  Text(
                    '(${(_todayWorkingHours * 60).toStringAsFixed(0)}m)',
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _showClockOutDialog = false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _handleCheckOut,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Clock Out'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 14, color: Colors.grey[600]),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  Widget _buildProjectPlanCard(Map<String, dynamic> plan) {
    final planName = plan['plan_name']?.toString() ?? plan['planName']?.toString() ?? 'N/A';
    final projectName = plan['project_name']?.toString() ?? 
                       plan['projectName']?.toString() ?? 
                       plan['project']?['projectName']?.toString() ?? 'N/A';
    final allottedHours = plan['allotted_hours']?.toString() ?? 
                         plan['allottedHours']?.toString() ?? 
                         plan['employee_hours']?.toString() ?? 
                         '0';
    final timePeriod = plan['time_period']?.toString() ?? 
                      plan['timePeriod']?.toString() ?? 'N/A';
    final status = plan['plan_status']?.toString() ??
        plan['status']?.toString() ??
        'draft';
    final startDate = plan['start_date']?.toString() ?? 
                     plan['startDate']?.toString();
    final endDate = plan['end_date']?.toString() ?? 
                   plan['endDate']?.toString();
    
    Color statusColor;
    String statusText;
    switch (status.toLowerCase()) {
      case 'active':
        statusColor = Colors.green;
        statusText = 'Active';
        break;
      case 'completed':
        statusColor = Colors.blue;
        statusText = 'Completed';
        break;
      case 'cancelled':
        statusColor = Colors.red;
        statusText = 'Cancelled';
        break;
      default:
        statusColor = Colors.orange;
        statusText = 'Draft';
    }

    String formatDate(String? dateStr) {
      if (dateStr == null || dateStr.isEmpty) return 'N/A';
      try {
        final date = DateTime.tryParse(dateStr);
        if (date != null) {
          return DateFormat('MMM dd, yyyy').format(date);
        }
      } catch (e) {
        debugPrint('Error parsing date: $e');
      }
      return dateStr;
    }

    String formatTimePeriod(String period) {
      switch (period.toLowerCase()) {
        case 'weekly':
          return 'Weekly';
        case 'monthly':
          return 'Monthly';
        case '3_months':
          return '3 Months';
        case '6_months':
          return '6 Months';
        case '9_months':
          return '9 Months';
        case 'yearly':
          return 'Yearly';
        default:
          return period;
      }
    }

    return InkWell(
      onTap: () => _showProjectPlanWorkDetails(plan),
      borderRadius: BorderRadius.circular(12),
      child: Card(
        elevation: 2,
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        planName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        projectName,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildPlanInfoItem(
                    Icons.access_time,
                    '$allottedHours hrs',
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildPlanInfoItem(
                    Icons.calendar_today,
                    formatTimePeriod(timePeriod),
                    Colors.purple,
                  ),
                ),
              ],
            ),
            if (startDate != null || endDate != null) ...[
              const SizedBox(height: 8),
              Divider(height: 1, color: Colors.grey[300]),
              const SizedBox(height: 8),
              Row(
                children: [
                  if (startDate != null)
                    Expanded(
                      child: _buildPlanInfoItem(
                        Icons.play_arrow,
                        'Start: ${formatDate(startDate)}',
                        Colors.green,
                      ),
                    ),
                  if (endDate != null)
                    Expanded(
                      child: _buildPlanInfoItem(
                        Icons.stop,
                        'End: ${formatDate(endDate)}',
                        Colors.orange,
                      ),
                    ),
                ],
              ),
            ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showProjectPlanWorkDetails(Map<String, dynamic> plan) async {
    final planName = plan['plan_name']?.toString() ?? plan['planName']?.toString() ?? 'N/A';
    final projectName = plan['project_name']?.toString() ?? 
                       plan['projectName']?.toString() ?? 
                       plan['project']?['projectName']?.toString() ?? 'N/A';
    final projectId = plan['project_id']?.toString() ?? 
                     plan['projectId']?.toString() ?? 
                     plan['project']?['id']?.toString();
    
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final employeeId = AppConfig.employeeDbIdForApi(user);
      
      if (employeeId == null || employeeId.isEmpty) {
        Navigator.pop(context); // Close loading
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Employee ID not found')),
        );
        return;
      }

      // Fetch work details for this employee
      final allWorkDetails = await _apiService.getWorkDetails(employeeId: employeeId);
      
      // Filter work details by project name
      final filteredWorkDetails = allWorkDetails.where((work) {
        final workProjectName = work['projectName']?.toString() ?? '';
        return workProjectName.toLowerCase() == projectName.toLowerCase();
      }).toList();

      // Close loading dialog
      Navigator.pop(context);

      // Show work details bottom sheet
      if (mounted) {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => _buildWorkDetailsBottomSheet(
            planName: planName,
            projectName: projectName,
            workDetails: filteredWorkDetails,
          ),
        );
      }
    } catch (e) {
      Navigator.pop(context); // Close loading
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading work details: $e')),
        );
      }
    }
  }

  Widget _buildWorkDetailsBottomSheet({
    required String planName,
    required String projectName,
    required List<dynamic> workDetails,
  }) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            planName,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            projectName,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Work Details List
              Expanded(
                child: workDetails.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.work_outline,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No work details found',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Work details for this project plan will appear here',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[500],
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: workDetails.length,
                        itemBuilder: (context, index) {
                          final work = workDetails[index];
                          return _buildWorkDetailCard(work);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWorkDetailCard(Map<String, dynamic> work) {
    final date = work['sentDate']?.toString() ?? 
                work['date']?.toString() ?? 
                work['workDate']?.toString() ?? 'N/A';
    final clockIn = work['clockInTime']?.toString() ?? 
                   work['clockIn']?.toString() ?? 
                   work['inTime']?.toString() ?? 'N/A';
    final clockOut = work['clockOutTime']?.toString() ?? 
                    work['clockOut']?.toString() ?? 
                    work['outTime']?.toString() ?? 'N/A';
    final totalHours = work['totalHours']?.toString() ?? 
                      work['hours']?.toString() ?? 
                      '0';
    final status = work['status']?.toString() ?? 'pending';
    final areaOfWork = work['areaofWork']?.toString() ?? 
                      work['areaOfWork']?.toString() ?? '';
    final referenceNo = work['referenceNo']?.toString() ?? '';

    Color statusColor;
    String statusText;
    IconData statusIcon;
    switch (status.toLowerCase()) {
      case 'completed':
        statusColor = Colors.green;
        statusText = 'Completed';
        statusIcon = Icons.check_circle;
        break;
      case 'active':
        statusColor = Colors.blue;
        statusText = 'Active';
        statusIcon = Icons.play_circle;
        break;
      case 'approved':
        statusColor = Colors.green;
        statusText = 'Approved';
        statusIcon = Icons.check_circle;
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusText = 'Rejected';
        statusIcon = Icons.cancel;
        break;
      default:
        statusColor = Colors.orange;
        statusText = 'Pending';
        statusIcon = Icons.pending;
    }

    String formatDateTime(String? dateTimeStr) {
      if (dateTimeStr == null || dateTimeStr.isEmpty || dateTimeStr == 'N/A') {
        return 'N/A';
      }
      try {
        final dateTime = DateTime.tryParse(dateTimeStr);
        if (dateTime != null) {
          return DateFormat('MMM dd, yyyy HH:mm').format(dateTime);
        }
      } catch (e) {
        debugPrint('Error parsing datetime: $e');
      }
      return dateTimeStr;
    }

    String formatDate(String? dateStr) {
      if (dateStr == null || dateStr.isEmpty || dateStr == 'N/A') {
        return 'N/A';
      }
      try {
        // Handle date strings that might be just dates
        if (dateStr.length >= 10) {
          final date = DateTime.tryParse(dateStr.substring(0, 10));
          if (date != null) {
            return DateFormat('MMM dd, yyyy').format(date);
          }
        }
        final date = DateTime.tryParse(dateStr);
        if (date != null) {
          return DateFormat('MMM dd, yyyy').format(date);
        }
      } catch (e) {
        debugPrint('Error parsing date: $e');
      }
      return dateStr;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        formatDate(date),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (referenceNo.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Ref: $referenceNo',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 14, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        statusText,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildWorkDetailInfo(
                    Icons.login,
                    'Clock In',
                    formatDateTime(clockIn),
                    Colors.green,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildWorkDetailInfo(
                    Icons.logout,
                    'Clock Out',
                    formatDateTime(clockOut),
                    Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 20, color: Colors.blue),
                      const SizedBox(width: 8),
                      Text(
                        'Total Hours',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '$totalHours hrs',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
            ),
            if (areaOfWork.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.work_outline, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Area: $areaOfWork',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWorkDetailInfo(IconData icon, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildPlanInfoItem(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _LeaveBalanceCardData {
  const _LeaveBalanceCardData({
    required this.label,
    required this.balance,
    required this.accrued,
    required this.used,
  });
  final String label;
  final double balance;
  final double accrued;
  final double used;
}