import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/attendance_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final ApiService _apiService = ApiService();
  final _referenceController = TextEditingController();
  String _selectedProject = '';
  String _selectedAreaOfWork = '';
  List<dynamic> _projects = [];
  List<dynamic> _areaOfWorkList = [];
  bool _isLoadingProjects = false;
  String? _projectsError;

  @override
  void initState() {
    super.initState();
    // Add a small delay to ensure AuthProvider has loaded user data
    // This is especially important in release builds where initialization might be different
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Wait a bit for AuthProvider to finish loading user from SharedPreferences
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          _loadProjectsAndAreaOfWork();
        }
      });
      
      // Also listen to AuthProvider changes in case user data loads later
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      authProvider.addListener(_onAuthChanged);
    });
  }
  
  void _onAuthChanged() {
    // Reload projects when user data becomes available
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.user != null && _projects.isEmpty && !_isLoadingProjects) {
      print('🔄 User data available, reloading projects...');
      _loadProjectsAndAreaOfWork();
    }
  }
  
  @override
  void dispose() {
    // Remove listener to prevent memory leaks
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      authProvider.removeListener(_onAuthChanged);
    } catch (e) {
      // Ignore if context is no longer available
    }
    _referenceController.dispose();
    super.dispose();
  }

  Future<void> _loadProjectsAndAreaOfWork() async {
    setState(() => _isLoadingProjects = true);
    try {
      // Get current user ID to fetch assigned projects from project plans
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      
      if (user == null) {
        debugPrint('ERROR: User is null, cannot fetch projects');
        if (mounted) {
          _showError('User not found. Please login again.');
        }
        setState(() {
          _projects = [];
          _areaOfWorkList = [];
        });
        return;
      }
      
      // Try multiple possible ID fields (matching frontend logic)
      // In release builds, user data structure might be different
      final employeeId = user['id']?.toString() ?? 
                         user['employeeId']?.toString() ?? 
                         user['EMPID']?.toString() ??
                         user['employee_id']?.toString();
      
      // Log for debugging (works in both debug and release with proper logging)
      print('🔍 Loading projects for employeeId: $employeeId');
      print('🔍 User data keys: ${user.keys.toList()}');
      print('🔍 Full user data: $user');
      
      if (employeeId == null || employeeId.isEmpty) {
        print('❌ ERROR: Employee ID is null or empty');
        print('❌ Available user keys: ${user.keys.toList()}');
        print('❌ User values: ${user.values.toList()}');
        
        if (mounted) {
          final errorMsg = 'Employee ID not found. Available keys: ${user.keys.join(", ")}. Please login again.';
          _showError(errorMsg);
          setState(() {
            _projectsError = errorMsg;
            _projects = [];
            _areaOfWorkList = [];
          });
        }
        return;
      }
      
      // Fetch area of work
      List<dynamic> areaOfWork = [];
      try {
        areaOfWork = await _apiService.getAreaOfWork();
        debugPrint('Loaded ${areaOfWork.length} area of work items');
      } catch (e) {
        debugPrint('Error fetching area of work: $e');
        // Continue even if area of work fails
      }
      
      // Fetch assigned projects from project plans (matching frontend logic)
      List<dynamic> assignedProjects = [];
      try {
        print('📡 Calling API: getEmployeeAssignedProjects with employeeId: $employeeId');
        // Use the API endpoint to get assigned projects with allotted hours
        assignedProjects = await _apiService.getEmployeeAssignedProjects(employeeId: employeeId);
        print('✅ Loaded ${assignedProjects.length} assigned projects from project plans');
        
        if (assignedProjects.isEmpty) {
          print('⚠️ No assigned projects found for employeeId: $employeeId');
          // Show helpful message to user
          if (mounted) {
            setState(() {
              _projectsError = 'No assigned projects found. Please contact your manager to assign projects.';
            });
          }
        } else {
          // Clear any previous errors on success
          if (mounted) {
            setState(() {
              _projectsError = null;
            });
          }
        }
      } catch (e) {
        print('❌ Error fetching assigned projects from project plans: $e');
        print('❌ Error type: ${e.runtimeType}');
        if (e is DioException) {
          print('❌ DioException details:');
          print('  Status code: ${e.response?.statusCode}');
          print('  Response data: ${e.response?.data}');
          print('  Request path: ${e.requestOptions.path}');
          print('  Request query: ${e.requestOptions.queryParameters}');
          print('  Base URL: ${e.requestOptions.baseUrl}');
        }
        
        // Store error message for UI display
        if (mounted) {
          final errorMessage = e is DioException 
              ? 'Failed to load projects: ${e.response?.statusCode ?? 'Network error'}'
              : 'Failed to load projects. Please try again.';
          setState(() {
            _projectsError = errorMessage;
          });
          _showError(errorMessage);
        }
        
        // Don't fallback to all projects - only show assigned projects
        assignedProjects = [];
      }
      
      if (mounted) {
        setState(() {
          _projects = assignedProjects; // Only assigned projects from plans
          _areaOfWorkList = areaOfWork;
          _projectsError = null; // Clear error on success
        });
      }
    } catch (e) {
      debugPrint('❌ Unexpected error loading projects and area of work: $e');
      debugPrint('Error stack: ${StackTrace.current}');
      if (mounted) {
        _showError('Unexpected error loading data. Please try again.');
        setState(() {
          _projects = [];
          _areaOfWorkList = [];
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingProjects = false);
      }
    }
  }

  Future<void> _handleClockIn() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final attendanceProvider =
        Provider.of<AttendanceProvider>(context, listen: false);

    if (authProvider.user == null) {
      _showError('User not found');
      return;
    }

    final success = await attendanceProvider.clockIn(
      employeeId: authProvider.user!['EMPID']?.toString() ?? '',
      employeeName: authProvider.user!['employeeName'] ?? '',
      projectName: _selectedProject.isEmpty ? null : _selectedProject,
      referenceNo: _referenceController.text.trim().isEmpty
          ? null
          : _referenceController.text.trim(),
      areaOfWork: _selectedAreaOfWork.isEmpty
          ? null
          : _selectedAreaOfWork,
    );

    if (success && mounted) {
      _showSuccess('Clocked in successfully');
      _clearFields();
    } else if (mounted) {
      _showError(attendanceProvider.error ?? 'Clock in failed');
    }
  }

  Future<void> _handleClockOut() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final attendanceProvider =
        Provider.of<AttendanceProvider>(context, listen: false);

    if (authProvider.user == null ||
        attendanceProvider.currentAttendance == null) {
      _showError('No active attendance found');
      return;
    }

    final workDetailId =
        attendanceProvider.currentAttendance!['id']?.toString() ?? '';

    final success = await attendanceProvider.clockOut(
      employeeId: authProvider.user!['EMPID']?.toString() ?? '',
      workDetailId: workDetailId,
    );

    if (success && mounted) {
      _showSuccess('Clocked out successfully');
      _clearFields();
    } else if (mounted) {
      _showError(attendanceProvider.error ?? 'Clock out failed');
    }
  }

  void _clearFields() {
    setState(() {
      _selectedProject = '';
      _selectedAreaOfWork = '';
    });
    _referenceController.clear();
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
      ),
      body: Consumer<AttendanceProvider>(
        builder: (context, attendanceProvider, _) {
          return RefreshIndicator(
            onRefresh: _loadProjectsAndAreaOfWork,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                // Status Card with Modern Design
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: attendanceProvider.isClockedIn
                          ? [
                              Colors.green.shade400,
                              Colors.green.shade600,
                            ]
                          : [
                              Colors.grey.shade400,
                              Colors.grey.shade600,
                            ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: (attendanceProvider.isClockedIn
                                ? Colors.green
                                : Colors.grey)
                            .withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            attendanceProvider.isClockedIn
                                ? Icons.check_circle_rounded
                                : Icons.radio_button_unchecked_rounded,
                            size: 64,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          attendanceProvider.isClockedIn
                              ? 'Currently Clocked In'
                              : 'Currently Clocked Out',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        if (attendanceProvider.currentAttendance != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Since: ${DateFormat('MMM dd, yyyy HH:mm').format(DateTime.parse(attendanceProvider.currentAttendance!['timestamp'] ?? DateTime.now().toIso8601String()))}',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                        // Show error message if projects failed to load
                        if (_projectsError != null)
                          Card(
                            color: Colors.red.shade50,
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.error_outline, color: Colors.red.shade700),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          'Error loading projects',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.red.shade700,
                                          ),
                                        ),
                                      ),
                                      IconButton(
                                        icon: Icon(Icons.refresh, color: Colors.red.shade700),
                                        onPressed: _loadProjectsAndAreaOfWork,
                                        tooltip: 'Retry',
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _projectsError!,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.red.shade600,
                                    ),
                                  ),
                                  // Debug info in release builds (helpful for troubleshooting)
                                  if (kDebugMode)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: Text(
                                        'User ID: ${Provider.of<AuthProvider>(context, listen: false).user?['id'] ?? 'null'}\n'
                                        'Employee ID: ${Provider.of<AuthProvider>(context, listen: false).user?['employeeId'] ?? 'null'}\n'
                                        'EMPID: ${Provider.of<AuthProvider>(context, listen: false).user?['EMPID'] ?? 'null'}',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.grey.shade700,
                                          fontFamily: 'monospace',
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        if (_projectsError != null) const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Additional Information',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 20),
                        DropdownButtonFormField<String>(
                          value: _selectedProject.isEmpty || 
                                  !_projects.any((p) => p['projectName']?.toString() == _selectedProject)
                              ? null
                              : _selectedProject,
                          decoration: InputDecoration(
                            labelText: 'Project Name',
                            helperText: _projects.isEmpty 
                                ? (_isLoadingProjects 
                                    ? 'Loading projects...' 
                                    : 'No assigned projects from project plans')
                                : 'Showing only assigned projects from project plans',
                            prefixIcon: Icon(
                              Icons.work_outline_rounded,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            border: OutlineInputBorder(),
                          ),
                          items: [
                            const DropdownMenuItem(value: null, child: Text('None')),
                            if (_projects.isEmpty && !_isLoadingProjects)
                              const DropdownMenuItem(
                                value: null,
                                enabled: false,
                                child: Text(
                                  'No assigned projects from project plans',
                                  style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey),
                                ),
                              )
                            else
                              ..._projects
                                  .where((project) => project['projectName']?.toString().isNotEmpty == true)
                                  .map((project) {
                                    final projectName = project['projectName']?.toString() ?? '';
                                    // Match frontend: check allotted_hours (from project plans)
                                    final allottedHours = project['allotted_hours']?.toString() ?? 
                                                         project['allotatedHours']?.toString() ?? 
                                                         project['allottedHours']?.toString();
                                    final displayText = allottedHours != null && 
                                                       allottedHours.isNotEmpty && 
                                                       double.tryParse(allottedHours) != null
                                        ? '$projectName (${allottedHours} hrs)'
                                        : projectName;
                                    return DropdownMenuItem(
                                      value: projectName,
                                      child: Text(displayText),
                                    );
                                  })
                                  .toList(),
                          ],
                          onChanged: _isLoadingProjects ? null : (value) {
                            setState(() {
                              _selectedProject = value ?? '';
                              if (value != null && value.isNotEmpty) {
                                final selectedProjectData = _projects.firstWhere(
                                  (p) => p['projectName']?.toString() == value,
                                  orElse: () => <String, dynamic>{},
                                );
                                if (selectedProjectData.isNotEmpty && 
                                    selectedProjectData['referenceNo'] != null) {
                                  _referenceController.text = selectedProjectData['referenceNo'].toString();
                                }
                              } else {
                                _referenceController.clear();
                              }
                            });
                          },
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _referenceController,
                          decoration: InputDecoration(
                            labelText: 'Reference Number (Optional)',
                            prefixIcon: Icon(
                              Icons.tag_outlined,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _selectedAreaOfWork.isEmpty || 
                                  !_areaOfWorkList.any((area) => area['areaofwork']?.toString() == _selectedAreaOfWork)
                              ? null
                              : _selectedAreaOfWork,
                          decoration: InputDecoration(
                            labelText: 'Area of Work (Optional)',
                            prefixIcon: Icon(
                              Icons.location_on_outlined,
                              color: Theme.of(context).colorScheme.primary,
                            ),
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
                          onChanged: (value) {
                            setState(() {
                              _selectedAreaOfWork = value ?? '';
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                if (attendanceProvider.isClockedIn)
                  SizedBox(
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: attendanceProvider.isLoading
                          ? null
                          : _handleClockOut,
                      icon: const Icon(Icons.logout_rounded, size: 22),
                      label: const Text(
                        'Clock Out',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade600,
                        foregroundColor: Colors.white,
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  )
                else
                  SizedBox(
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: attendanceProvider.isLoading
                          ? null
                          : _handleClockIn,
                      icon: const Icon(Icons.login_rounded, size: 22),
                      label: const Text(
                        'Clock In',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade600,
                        foregroundColor: Colors.white,
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                if (attendanceProvider.isLoading)
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

