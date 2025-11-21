import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/leave_provider.dart';
import 'package:intl/intl.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedLeaveType;
  DateTime? _leaveFrom;
  DateTime? _leaveTo;
  final _reasonController = TextEditingController();

  final List<String> _leaveTypes = [
    'Annual',
    'Sick',
    'Casual',
    'Emergency',
    'Comp Off',
  ];

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _handleApplyLeave() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLeaveType == null) {
      _showError('Please select a leave type');
      return;
    }
    if (_leaveFrom == null || _leaveTo == null) {
      _showError('Please select leave dates');
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final leaveProvider = Provider.of<LeaveProvider>(context, listen: false);

    if (authProvider.user == null) {
      _showError('User not found');
      return;
    }

    final success = await leaveProvider.applyLeave(
      employeeId: authProvider.user!['EMPID']?.toString() ?? '',
      employeeName: authProvider.user!['employeeName'] ?? '',
      leaveType: _selectedLeaveType!.toLowerCase(),
      leaveFrom: DateFormat('yyyy-MM-dd').format(_leaveFrom!),
      leaveTo: DateFormat('yyyy-MM-dd').format(_leaveTo!),
      reason: _reasonController.text.trim(),
    );

    if (success && mounted) {
      _showSuccess('Leave application submitted successfully');
      _clearForm();
    } else if (mounted) {
      _showError(leaveProvider.error ?? 'Leave application failed');
    }
  }

  void _clearForm() {
    setState(() {
      _selectedLeaveType = null;
      _leaveFrom = null;
      _leaveTo = null;
    });
    _reasonController.clear();
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

  Future<void> _selectDate(
    BuildContext context,
    bool isFromDate,
  ) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isFromDate
          ? (_leaveFrom ?? DateTime.now())
          : (_leaveTo ?? _leaveFrom ?? DateTime.now()),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        if (isFromDate) {
          _leaveFrom = picked;
          if (_leaveTo != null && _leaveTo!.isBefore(_leaveFrom!)) {
            _leaveTo = null;
          }
        } else {
          if (_leaveFrom == null || picked.isAfter(_leaveFrom!)) {
            _leaveTo = picked;
          } else {
            _showError('Leave to date must be after leave from date');
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply Leave'),
      ),
      body: Consumer<LeaveProvider>(
        builder: (context, leaveProvider, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .primary
                                      .withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  Icons.calendar_today_rounded,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              const SizedBox(width: 16),
                              const Expanded(
                                child: Text(
                                  'Leave Application',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E293B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          DropdownButtonFormField<String>(
                            value: _selectedLeaveType,
                            decoration: InputDecoration(
                              labelText: 'Leave Type',
                              prefixIcon: Icon(
                                Icons.event_note_rounded,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                            items: _leaveTypes.map((type) {
                              return DropdownMenuItem(
                                value: type,
                                child: Text(type),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() => _selectedLeaveType = value);
                            },
                            validator: (value) {
                              if (value == null) {
                                return 'Please select a leave type';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 20),
                          InkWell(
                            onTap: () => _selectDate(context, true),
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: 'Leave From',
                                prefixIcon: Icon(
                                  Icons.calendar_today_rounded,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              child: Text(
                                _leaveFrom == null
                                    ? 'Select date'
                                    : DateFormat('MMM dd, yyyy')
                                        .format(_leaveFrom!),
                                style: TextStyle(
                                  color: _leaveFrom == null
                                      ? Colors.grey.shade600
                                      : Colors.black87,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          InkWell(
                            onTap: () => _selectDate(context, false),
                            child: InputDecorator(
                              decoration: InputDecoration(
                                labelText: 'Leave To',
                                prefixIcon: Icon(
                                  Icons.event_rounded,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              child: Text(
                                _leaveTo == null
                                    ? 'Select date'
                                    : DateFormat('MMM dd, yyyy')
                                        .format(_leaveTo!),
                                style: TextStyle(
                                  color: _leaveTo == null
                                      ? Colors.grey.shade600
                                      : Colors.black87,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          TextFormField(
                            controller: _reasonController,
                            decoration: InputDecoration(
                              labelText: 'Reason (Optional)',
                              prefixIcon: Icon(
                                Icons.note_outlined,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                            maxLines: 3,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 56,
                    child: leaveProvider.isLoading
                        ? ElevatedButton(
                            onPressed: null,
                            style: ElevatedButton.styleFrom(
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            ),
                          )
                        : ElevatedButton.icon(
                            onPressed: _handleApplyLeave,
                            icon: const Icon(Icons.send_rounded, size: 22),
                            label: const Text(
                              'Apply Leave',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
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

