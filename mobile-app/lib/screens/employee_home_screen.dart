import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/attendance_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/services/background_timer_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:intl/intl.dart';
import 'dart:ui'; // Added for FontFeature

class EmployeeHomeScreen extends StatefulWidget {
  const EmployeeHomeScreen({super.key});

  @override
  State<EmployeeHomeScreen> createState() => _EmployeeHomeScreenState();
}

class _EmployeeHomeScreenState extends State<EmployeeHomeScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  Map<String, dynamic>? _leaveBalances;
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
  String _selectedProject = '';
  String _referenceNo = '';
  String _selectedAreaOfWork = '';
  List<dynamic> _projects = [];
  List<dynamic> _areaOfWorkList = [];
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
    });
    _loadProjectsAndAreaOfWork();
  }

  Future<void> _loadProjectsAndAreaOfWork() async {
    try {
      final projects = await _apiService.getProjects();
      final areaOfWork = await _apiService.getAreaOfWork();
      
      // Get current user ID to filter assigned projects
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final employeeId = user?['id']?.toString() ?? user?['employeeId']?.toString();
      
      // Filter projects to show only assigned projects
      List<dynamic> assignedProjects = [];
      if (employeeId != null && projects != null) {
        final userId = int.tryParse(employeeId);
        if (userId != null) {
          assignedProjects = projects.where((project) {
            // Check if project has assignedEmployees
            if (project['assignedEmployees'] == null) return false;
            
            dynamic assignedEmployees = project['assignedEmployees'];
            List<int> assignedIds = [];
            
            // Handle different formats: string (JSON), array, or null
            if (assignedEmployees is String) {
              try {
                // Try parsing as JSON array string like "[25,23]" or "[25, 23]"
                String cleaned = assignedEmployees.trim();
                if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                  cleaned = cleaned.substring(1, cleaned.length - 1);
                }
                assignedIds = cleaned
                    .split(',')
                    .map((id) => int.tryParse(id.trim()))
                    .whereType<int>()
                    .toList();
              } catch (e) {
                // If parsing fails, try splitting by comma directly
                assignedIds = assignedEmployees
                    .split(',')
                    .map((id) => int.tryParse(id.trim()))
                    .whereType<int>()
                    .toList();
              }
            } else if (assignedEmployees is List) {
              assignedIds = assignedEmployees.map((id) {
                if (id is int) return id;
                if (id is String) return int.tryParse(id);
                return null;
              }).whereType<int>().toList();
            }
            
            // Check if current user ID is in the assigned employees list
            return assignedIds.contains(userId);
          }).toList();
        } else {
          // If employeeId is not a valid integer, show all projects (fallback)
          assignedProjects = projects;
        }
      } else {
        // If no employeeId, show all projects (fallback)
        assignedProjects = projects ?? [];
      }
      
      setState(() {
        _projects = assignedProjects;
        _areaOfWorkList = areaOfWork;
      });
    } catch (e) {
      // Silently fail
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

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString();
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

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
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

      final empName = user['employeeName']?.toString().trim() ?? 
                     user['name']?.toString().trim() ?? '';
      
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

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
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

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
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

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString();
      final currentYear = DateTime.now().year;

      // Load leave balance
      final leaveBalance = await _apiService.getLeaveBalance(
        employeeId: employeeId,
        year: currentYear,
      );
      
      // Load comp-off details
      final compOffDetails = await _apiService.getCompOffDetails(employeeId: employeeId);
      
      // Calculate balances
      double total = 0, casual = 0, sick = 0, earned = 0, compOff = 0;
      
      if (leaveBalance.isNotEmpty) {
        for (var item in leaveBalance) {
          final leaveType = (item['leave_type'] ?? item['leaveType'] ?? '').toString().toLowerCase();
          final balance = (item['balance'] ?? 0).toDouble();
          
          if (leaveType == 'casual') {
            casual = balance;
          } else if (leaveType == 'sick') {
            sick = balance;
          } else if (leaveType == 'annual') {
            earned = balance;
          }
          total += balance;
        }
      }

      // Calculate comp-off
      if (compOffDetails.isNotEmpty) {
        final approvedCompOff = compOffDetails
            .where((item) => (item['leaveStatus'] ?? '').toString().toLowerCase() == 'approved')
            .fold<double>(0, (sum, item) => sum + ((item['eligibility'] ?? 0).toDouble() / 9));
        
        final leaveDetails = await _apiService.getLeaveDetails(employeeId: employeeId);
        final usedCompOff = leaveDetails
            .where((item) => 
                (item['leaveType'] ?? '').toString() == 'Comp-off' &&
                (item['leaveStatus'] ?? '').toString().toLowerCase() == 'approved')
            .fold<double>(0, (sum, item) => sum + ((item['leaveHours'] ?? 0).toDouble()));
        
        compOff = (approvedCompOff - usedCompOff).clamp(0, double.infinity);
        total += compOff;
      }

      setState(() {
        _leaveBalances = {
          'total': total,
          'casual': casual,
          'sick': sick,
          'earned': earned,
          'compOff': compOff,
        };
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

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString();
      
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
            await _loadData();
            await _checkTodayAttendance();
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
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFF667EEA), // Light purple
                    const Color(0xFF764BA2), // Dark purple
                  ],
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF667EEA).withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Consumer<AuthProvider>(
                builder: (context, authProvider, _) {
                  final user = authProvider.user;
                  return Row(
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
                            const SizedBox(height: 12),
                            Text(
                              user?['employeeName'] ?? 'Employee',
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
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
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
                                      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
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
            
            // Leave Balance Cards
            if (_leaveBalances != null) ...[
              const Text(
                'Leave Balance',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _buildLeaveCard('Total Leave', _leaveBalances!['total'], Colors.purple),
                  _buildLeaveCard('Casual Leave', _leaveBalances!['casual'], Colors.pink),
                  _buildLeaveCard('Sick Leave', _leaveBalances!['sick'], Colors.blue),
                  _buildLeaveCard('Earned Leave', _leaveBalances!['earned'], Colors.green),
                  _buildLeaveCard('Comp-off', _leaveBalances!['compOff'], Colors.orange),
                ],
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

  Widget _buildLeaveCard(String title, double value, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [color.withOpacity(0.8), color],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              value.toStringAsFixed(1),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.white70,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
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
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('None')),
                ..._projects
                    .where((project) => project['projectName']?.toString().isNotEmpty == true)
                    .map((project) => project['projectName']?.toString() ?? '')
                    .toSet()
                    .map((projectName) {
                      return DropdownMenuItem(
                        value: projectName,
                        child: Text(projectName),
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
}