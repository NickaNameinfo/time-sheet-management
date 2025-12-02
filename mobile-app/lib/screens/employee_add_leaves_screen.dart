import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class EmployeeAddLeavesScreen extends StatefulWidget {
  const EmployeeAddLeavesScreen({super.key});

  @override
  State<EmployeeAddLeavesScreen> createState() => _EmployeeAddLeavesScreenState();
}

class _EmployeeAddLeavesScreenState extends State<EmployeeAddLeavesScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isSubmitting = false;
  List<dynamic> _leaveDetails = [];
  
  // Form controllers
  final _leaveTypeController = TextEditingController();
  final _fromDateController = TextEditingController();
  final _toDateController = TextEditingController();
  final _reasonController = TextEditingController();
  
  DateTime? _fromDate;
  DateTime? _toDate;
  String _selectedLeaveType = 'Casual';

  @override
  void initState() {
    super.initState();
    _loadLeaveDetails();
  }

  @override
  void dispose() {
    _leaveTypeController.dispose();
    _fromDateController.dispose();
    _toDateController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadLeaveDetails() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString();
      final leaveDetails = await _apiService.getLeaveDetails(employeeId: employeeId);

      setState(() {
        _leaveDetails = leaveDetails;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading leave details: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _selectDate(BuildContext context, bool isFromDate) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isFromDate ? (_fromDate ?? DateTime.now()) : (_toDate ?? _fromDate ?? DateTime.now()),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null) {
      setState(() {
        if (isFromDate) {
          _fromDate = picked;
          _fromDateController.text = DateFormat('yyyy-MM-dd').format(picked);
          if (_toDate != null && _toDate!.isBefore(_fromDate!)) {
            _toDate = null;
            _toDateController.clear();
          }
        } else {
          if (_fromDate != null && picked.isBefore(_fromDate!)) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('To date must be after from date')),
            );
            return;
          }
          _toDate = picked;
          _toDateController.text = DateFormat('yyyy-MM-dd').format(picked);
        }
      });
    }
  }

  Future<void> _submitLeave() async {
    if (!_formKey.currentState!.validate()) return;
    if (_fromDate == null || _toDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select both from and to dates')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (employeeId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Employee ID not found')),
        );
        return;
      }

      await _apiService.applyLeave(
        employeeId: employeeId,
        employeeName: user['employeeName'] ?? user['name'] ?? '',
        leaveType: _selectedLeaveType,
        leaveFrom: _fromDateController.text,
        leaveTo: _toDateController.text,
        reason: _reasonController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Leave application submitted successfully')),
        );
        _formKey.currentState!.reset();
        _fromDate = null;
        _toDate = null;
        _fromDateController.clear();
        _toDateController.clear();
        _reasonController.clear();
        _loadLeaveDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error submitting leave: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _deleteLeave(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Leave'),
        content: const Text('Are you sure you want to delete this leave request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _apiService.deleteLeave(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Leave deleted successfully')),
        );
        _loadLeaveDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting leave: $e')),
        );
      }
    }
  }

  String _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'orange';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply Leave'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadLeaveDetails,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Form Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'Apply Leave',
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 16),
                            // Leave Type
                            DropdownButtonFormField<String>(
                              value: _selectedLeaveType,
                              decoration: const InputDecoration(
                                labelText: 'Leave Type',
                                border: OutlineInputBorder(),
                              ),
                              items: ['Casual', 'Sick', 'Annual', 'Emergency'].map((type) {
                                return DropdownMenuItem(
                                  value: type,
                                  child: Text(type),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() => _selectedLeaveType = value);
                                }
                              },
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please select leave type';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // From Date
                            TextFormField(
                              controller: _fromDateController,
                              decoration: const InputDecoration(
                                labelText: 'From Date',
                                border: OutlineInputBorder(),
                                suffixIcon: Icon(Icons.calendar_today),
                              ),
                              readOnly: true,
                              onTap: () => _selectDate(context, true),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please select from date';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // To Date
                            TextFormField(
                              controller: _toDateController,
                              decoration: const InputDecoration(
                                labelText: 'To Date',
                                border: OutlineInputBorder(),
                                suffixIcon: Icon(Icons.calendar_today),
                              ),
                              readOnly: true,
                              onTap: () => _selectDate(context, false),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please select to date';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // Reason
                            TextFormField(
                              controller: _reasonController,
                              decoration: const InputDecoration(
                                labelText: 'Reason',
                                border: OutlineInputBorder(),
                              ),
                              maxLines: 3,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter reason';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // Submit Button
                            ElevatedButton(
                              onPressed: _isSubmitting ? null : _submitLeave,
                              child: _isSubmitting
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : const Text('Submit Leave Request'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Leave Details List
                  const Text(
                    'My Leave Requests',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  _leaveDetails.isEmpty
                      ? const Card(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Center(child: Text('No leave requests')),
                          ),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _leaveDetails.length,
                          itemBuilder: (context, index) {
                            final leave = _leaveDetails[index];
                            final status = leave['leaveStatus']?.toString() ?? 'Pending';
                            final statusColor = _getStatusColor(status);
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                title: Text(leave['leaveType']?.toString() ?? ''),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('From: ${leave['leaveFrom']?.toString() ?? ''}'),
                                    Text('To: ${leave['leaveTo']?.toString() ?? ''}'),
                                    Text('Status: $status'),
                                  ],
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor == 'green'
                                            ? Colors.green
                                            : statusColor == 'red'
                                                ? Colors.red
                                                : Colors.orange,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        status,
                                        style: const TextStyle(color: Colors.white, fontSize: 12),
                                      ),
                                    ),
                                    if (status.toLowerCase() != 'approved')
                                      IconButton(
                                        icon: const Icon(Icons.delete, color: Colors.red),
                                        onPressed: () => _deleteLeave(leave['id']),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
    );
  }
}

