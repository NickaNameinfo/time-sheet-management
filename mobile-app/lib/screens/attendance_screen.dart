import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/attendance_provider.dart';
import 'package:intl/intl.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final _projectController = TextEditingController();
  final _referenceController = TextEditingController();
  final _areaController = TextEditingController();

  @override
  void dispose() {
    _projectController.dispose();
    _referenceController.dispose();
    _areaController.dispose();
    super.dispose();
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
      projectName: _projectController.text.trim().isEmpty
          ? null
          : _projectController.text.trim(),
      referenceNo: _referenceController.text.trim().isEmpty
          ? null
          : _referenceController.text.trim(),
      areaOfWork: _areaController.text.trim().isEmpty
          ? null
          : _areaController.text.trim(),
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
    _projectController.clear();
    _referenceController.clear();
    _areaController.clear();
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
                        TextField(
                          controller: _projectController,
                          decoration: InputDecoration(
                            labelText: 'Project Name (Optional)',
                            prefixIcon: Icon(
                              Icons.work_outline_rounded,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
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
                        TextField(
                          controller: _areaController,
                          decoration: InputDecoration(
                            labelText: 'Area of Work (Optional)',
                            prefixIcon: Icon(
                              Icons.location_on_outlined,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
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

