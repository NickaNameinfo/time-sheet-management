import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/attendance_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

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

  @override
  void initState() {
    super.initState();
    _loadProjectsAndAreaOfWork();
  }

  @override
  void dispose() {
    _referenceController.dispose();
    super.dispose();
  }

  Future<void> _loadProjectsAndAreaOfWork() async {
    setState(() => _isLoadingProjects = true);
    try {
      // Get current user ID to fetch assigned projects from project plans
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final employeeId = user?['id']?.toString() ?? user?['employeeId']?.toString();
      
      final areaOfWork = await _apiService.getAreaOfWork();
      
      // Fetch assigned projects from project plans (matching frontend logic)
      // Priority: Only show assigned projects from project plans
      List<dynamic> assignedProjects = [];
      if (employeeId != null && employeeId.isNotEmpty) {
        try {
          // Use the API endpoint to get assigned projects with allotted hours
          assignedProjects = await _apiService.getEmployeeAssignedProjects(employeeId: employeeId);
          debugPrint('Loaded ${assignedProjects.length} assigned projects from project plans');
        } catch (e) {
          debugPrint('Error fetching assigned projects from project plans: $e');
          // Don't fallback to all projects - only show assigned projects
          // This matches frontend behavior where it shows "No assigned projects" message
          assignedProjects = [];
        }
      }
      
      setState(() {
        _projects = assignedProjects; // Only assigned projects from plans
        _areaOfWorkList = areaOfWork;
      });
    } catch (e) {
      debugPrint('Error loading projects and area of work: $e');
      setState(() {
        _projects = [];
        _areaOfWorkList = [];
      });
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
          return SingleChildScrollView(
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
          );
        },
      ),
    );
  }
}

