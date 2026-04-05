import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:intl/intl.dart';

class EmployeeShiftDetailsScreen extends StatefulWidget {
  const EmployeeShiftDetailsScreen({super.key});

  @override
  State<EmployeeShiftDetailsScreen> createState() => _EmployeeShiftDetailsScreenState();
}

class _EmployeeShiftDetailsScreenState extends State<EmployeeShiftDetailsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _shiftAssignments = [];

  @override
  void initState() {
    super.initState();
    _loadShiftAssignments();
  }

  Future<void> _loadShiftAssignments() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user);
      final assignments = await _apiService.getShiftAssignments(employeeId: employeeId);

      setState(() {
        _shiftAssignments = assignments;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading shift details: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shift Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadShiftAssignments,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _shiftAssignments.isEmpty
              ? const Center(child: Text('No shift assignments found'))
              : RefreshIndicator(
                  onRefresh: _loadShiftAssignments,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _shiftAssignments.length,
                    itemBuilder: (context, index) {
                      final assignment = _shiftAssignments[index];
                      final shift = assignment['shift'] ?? {};
                      
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    shift['name']?.toString() ?? 'Shift',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (assignment['isActive'] == true)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.green,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Text(
                                        'Active',
                                        style: TextStyle(color: Colors.white, fontSize: 12),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              _buildShiftDetail('Start Time', shift['startTime']?.toString() ?? 'N/A'),
                              _buildShiftDetail('End Time', shift['endTime']?.toString() ?? 'N/A'),
                              _buildShiftDetail('Break Duration', '${shift['breakDuration'] ?? 0} minutes'),
                              if (assignment['assignmentDate'] != null)
                                _buildShiftDetail(
                                  'Assigned From',
                                  DateFormat('yyyy-MM-dd').format(
                                    DateTime.parse(assignment['assignmentDate'].toString()),
                                  ),
                                ),
                              if (assignment['endDate'] != null)
                                _buildShiftDetail(
                                  'Assigned To',
                                  DateFormat('yyyy-MM-dd').format(
                                    DateTime.parse(assignment['endDate'].toString()),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildShiftDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 14),
          ),
        ],
      ),
    );
  }
}

