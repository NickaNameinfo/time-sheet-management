import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:intl/intl.dart';

class EmployeeCompOffScreen extends StatefulWidget {
  const EmployeeCompOffScreen({super.key});

  @override
  State<EmployeeCompOffScreen> createState() => _EmployeeCompOffScreenState();
}

class _EmployeeCompOffScreenState extends State<EmployeeCompOffScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isSubmitting = false;
  List<dynamic> _compOffDetails = [];
  
  // Form controllers
  final _workDateController = TextEditingController();
  final _workHoursController = TextEditingController();
  final _projectDetailsController = TextEditingController();
  
  DateTime? _workDate;

  @override
  void initState() {
    super.initState();
    _loadCompOffDetails();
  }

  @override
  void dispose() {
    _workDateController.dispose();
    _workHoursController.dispose();
    _projectDetailsController.dispose();
    super.dispose();
  }

  Future<void> _loadCompOffDetails() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = user['id']?.toString() ?? user['employeeId']?.toString();
      final compOffDetails = await _apiService.getCompOffDetails(employeeId: employeeId);

      setState(() {
        _compOffDetails = compOffDetails;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading comp-off details: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _workDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
    );
    
    if (picked != null) {
      setState(() {
        _workDate = picked;
        _workDateController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _submitCompOff() async {
    if (!_formKey.currentState!.validate()) return;
    if (_workDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select work date')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      await _apiService.applyCompOff({
        'employeeId': AppConfig.employeeDbIdForApi(user) ?? user['id'] ?? user['employeeId'],
        'employeeName': user['employeeName'] ?? user['name'] ?? '',
        'leaveType': 'CompOff',
        'leaveFrom': _workDateController.text,
        'workHours': double.tryParse(_workHoursController.text) ?? 0,
        'reason': _projectDetailsController.text,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Comp-off request submitted successfully')),
        );
        _formKey.currentState!.reset();
        _workDate = null;
        _workDateController.clear();
        _workHoursController.clear();
        _projectDetailsController.clear();
        _loadCompOffDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error submitting comp-off: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _deleteCompOff(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Comp-Off'),
        content: const Text('Are you sure you want to delete this comp-off request?'),
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
      await _apiService.deleteCompOff(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Comp-off deleted successfully')),
        );
        _loadCompOffDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting comp-off: $e')),
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
        title: const Text('Comp-Off'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCompOffDetails,
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
                              'Apply Comp-Off',
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 16),
                            // Work Date
                            TextFormField(
                              controller: _workDateController,
                              decoration: const InputDecoration(
                                labelText: 'Work Date',
                                border: OutlineInputBorder(),
                                suffixIcon: Icon(Icons.calendar_today),
                              ),
                              readOnly: true,
                              onTap: () => _selectDate(context),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please select work date';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // Work Hours
                            TextFormField(
                              controller: _workHoursController,
                              decoration: const InputDecoration(
                                labelText: 'Work Hours',
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: TextInputType.number,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter work hours';
                                }
                                final hours = double.tryParse(value);
                                if (hours == null || hours <= 0) {
                                  return 'Please enter valid hours';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // Project Details
                            TextFormField(
                              controller: _projectDetailsController,
                              decoration: const InputDecoration(
                                labelText: 'Project Details',
                                border: OutlineInputBorder(),
                              ),
                              maxLines: 3,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter project details';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // Submit Button
                            ElevatedButton(
                              onPressed: _isSubmitting ? null : _submitCompOff,
                              child: _isSubmitting
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : const Text('Submit Comp-Off Request'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Comp-Off Details List
                  const Text(
                    'My Comp-Off Requests',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  _compOffDetails.isEmpty
                      ? const Card(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Center(child: Text('No comp-off requests')),
                          ),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _compOffDetails.length,
                          itemBuilder: (context, index) {
                            final compOff = _compOffDetails[index];
                            final status = compOff['leaveStatus']?.toString() ?? 'Pending';
                            final statusColor = _getStatusColor(status);
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                title: Text('Work Date: ${compOff['leaveFrom']?.toString() ?? ''}'),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Work Hours: ${compOff['workHours']?.toString() ?? ''}'),
                                    Text('Eligibility: ${compOff['eligibility']?.toString() ?? ''}'),
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
                                        onPressed: () => _deleteCompOff(compOff['id']),
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

