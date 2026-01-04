import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';

class HrLeaveBalanceScreen extends StatefulWidget {
  const HrLeaveBalanceScreen({super.key});

  @override
  State<HrLeaveBalanceScreen> createState() => _HrLeaveBalanceScreenState();
}

class _HrLeaveBalanceScreenState extends State<HrLeaveBalanceScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _employees = [];
  List<dynamic> _leaveBalance = [];
  Map<String, dynamic>? _selectedEmployee;
  int _selectedYear = DateTime.now().year;

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  Future<void> _loadEmployees() async {
    setState(() => _isLoading = true);
    try {
      final employees = await _apiService.getEmployees();
      setState(() {
        _employees = employees;
        if (employees.isNotEmpty && _selectedEmployee == null) {
          _selectedEmployee = employees[0];
          _loadLeaveBalance();
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading employees: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadLeaveBalance() async {
    if (_selectedEmployee == null) return;
    
    setState(() => _isLoading = true);
    try {
      final employeeId = _selectedEmployee!['id']?.toString();
      final leaveBalance = await _apiService.getLeaveBalance(
        employeeId: employeeId,
        year: _selectedYear,
      );
      setState(() {
        _leaveBalance = leaveBalance;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading leave balance: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _initializeLeaveBalance() async {
    if (_selectedEmployee == null) return;

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _InitializeLeaveBalanceDialog(),
    );

    if (result != null) {
      try {
        await _apiService.initializeLeaveBalance({
          'employeeId': _selectedEmployee!['id'],
          'leaveType': result['leaveType'],
          'initialBalance': result['initialBalance'],
          'year': _selectedYear,
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Leave balance initialized successfully')),
          );
          _loadLeaveBalance();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _accrueLeave() async {
    if (_selectedEmployee == null) return;

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _AccrueLeaveDialog(),
    );

    if (result != null) {
      try {
        await _apiService.accrueLeave({
          'employeeId': _selectedEmployee!['id'],
          'leaveType': result['leaveType'],
          'accrualAmount': result['accrualAmount'],
          'accrualType': result['accrualType'],
          'comments': result['comments'] ?? '',
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Leave accrued successfully')),
          );
          _loadLeaveBalance();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _updateLeaveBalance() async {
    if (_selectedEmployee == null || _leaveBalance.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an employee with leave balance data')),
      );
      return;
    }

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _UpdateLeaveBalanceDialog(
        leaveBalance: _leaveBalance,
        selectedYear: _selectedYear,
      ),
    );

    if (result != null) {
      try {
        await _apiService.updateLeaveBalance({
          'employeeId': _selectedEmployee!['id'],
          'leaveType': result['leaveType'],
          'year': _selectedYear,
          if (result['balance'] != null) 'balance': result['balance'],
          if (result['accrued'] != null) 'accrued': result['accrued'],
          if (result['used'] != null) 'used': result['used'],
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Leave balance updated successfully')),
          );
          _loadLeaveBalance();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leave Balance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadLeaveBalance,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Employee and Year Selector
                Card(
                  margin: const EdgeInsets.all(16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        DropdownButtonFormField<Map<String, dynamic>>(
                          value: _selectedEmployee,
                          decoration: const InputDecoration(
                            labelText: 'Select Employee',
                            border: OutlineInputBorder(),
                          ),
                          items: _employees.map<DropdownMenuItem<Map<String, dynamic>>>((emp) {
                            return DropdownMenuItem<Map<String, dynamic>>(
                              value: emp as Map<String, dynamic>,
                              child: Text(emp['employeeName']?.toString() ?? ''),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedEmployee = value;
                            });
                            _loadLeaveBalance();
                          },
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Year:'),
                            DropdownButton<int>(
                              value: _selectedYear,
                              items: List.generate(5, (i) => DateTime.now().year - 2 + i).map((year) {
                                return DropdownMenuItem(
                                  value: year,
                                  child: Text(year.toString()),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() => _selectedYear = value);
                                  _loadLeaveBalance();
                                }
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                // Action Buttons
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _initializeLeaveBalance,
                              icon: const Icon(Icons.add),
                              label: const Text('Initialize'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _accrueLeave,
                              icon: const Icon(Icons.trending_up),
                              label: const Text('Accrue'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _updateLeaveBalance,
                          icon: const Icon(Icons.edit),
                          label: const Text('Update Balance'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Leave Balance List
                Expanded(
                  child: _leaveBalance.isEmpty
                      ? const Center(child: Text('No leave balance data'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _leaveBalance.length,
                          itemBuilder: (context, index) {
                            final balance = _leaveBalance[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                title: Text(
                                  balance['leave_type']?.toString() ?? balance['leaveType']?.toString() ?? 'Leave',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Balance: ${balance['balance'] ?? 0}'),
                                    Text('Accrued: ${balance['accrued'] ?? 0}'),
                                    Text('Used: ${balance['used'] ?? 0}'),
                                  ],
                                ),
                                trailing: Text(
                                  '${balance['balance'] ?? 0}',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}

class _InitializeLeaveBalanceDialog extends StatefulWidget {
  @override
  State<_InitializeLeaveBalanceDialog> createState() => _InitializeLeaveBalanceDialogState();
}

class _InitializeLeaveBalanceDialogState extends State<_InitializeLeaveBalanceDialog> {
  final _formKey = GlobalKey<FormState>();
  String _selectedLeaveType = 'annual';
  final _balanceController = TextEditingController();

  @override
  void dispose() {
    _balanceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Initialize Leave Balance'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedLeaveType,
              decoration: const InputDecoration(labelText: 'Leave Type'),
              items: ['annual', 'casual', 'sick', 'emergency'].map((type) {
                return DropdownMenuItem(value: type, child: Text(type.toUpperCase()));
              }).toList(),
              onChanged: (value) {
                if (value != null) setState(() => _selectedLeaveType = value);
              },
            ),
            TextFormField(
              controller: _balanceController,
              decoration: const InputDecoration(labelText: 'Initial Balance'),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) return 'Required';
                if (double.tryParse(value) == null) return 'Invalid number';
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              Navigator.pop(context, {
                'leaveType': _selectedLeaveType,
                'initialBalance': double.parse(_balanceController.text),
              });
            }
          },
          child: const Text('Initialize'),
        ),
      ],
    );
  }
}

class _AccrueLeaveDialog extends StatefulWidget {
  @override
  State<_AccrueLeaveDialog> createState() => _AccrueLeaveDialogState();
}

class _AccrueLeaveDialogState extends State<_AccrueLeaveDialog> {
  final _formKey = GlobalKey<FormState>();
  String _selectedLeaveType = 'annual';
  String _selectedAccrualType = 'monthly';
  final _amountController = TextEditingController();
  final _commentsController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _commentsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Accrue Leave'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedLeaveType,
              decoration: const InputDecoration(labelText: 'Leave Type'),
              items: ['annual', 'casual', 'sick'].map((type) {
                return DropdownMenuItem(value: type, child: Text(type.toUpperCase()));
              }).toList(),
              onChanged: (value) {
                if (value != null) setState(() => _selectedLeaveType = value);
              },
            ),
            DropdownButtonFormField<String>(
              value: _selectedAccrualType,
              decoration: const InputDecoration(labelText: 'Accrual Type'),
              items: ['monthly', 'quarterly', 'yearly'].map((type) {
                return DropdownMenuItem(value: type, child: Text(type.toUpperCase()));
              }).toList(),
              onChanged: (value) {
                if (value != null) setState(() => _selectedAccrualType = value);
              },
            ),
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(labelText: 'Accrual Amount'),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) return 'Required';
                if (double.tryParse(value) == null) return 'Invalid number';
                return null;
              },
            ),
            TextFormField(
              controller: _commentsController,
              decoration: const InputDecoration(labelText: 'Comments'),
              maxLines: 2,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              Navigator.pop(context, {
                'leaveType': _selectedLeaveType,
                'accrualType': _selectedAccrualType,
                'accrualAmount': double.parse(_amountController.text),
                'comments': _commentsController.text,
              });
            }
          },
          child: const Text('Accrue'),
        ),
      ],
    );
  }
}

class _UpdateLeaveBalanceDialog extends StatefulWidget {
  final List<dynamic> leaveBalance;
  final int selectedYear;

  const _UpdateLeaveBalanceDialog({
    required this.leaveBalance,
    required this.selectedYear,
  });

  @override
  State<_UpdateLeaveBalanceDialog> createState() => _UpdateLeaveBalanceDialogState();
}

class _UpdateLeaveBalanceDialogState extends State<_UpdateLeaveBalanceDialog> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedLeaveType;
  final _balanceController = TextEditingController();
  final _accruedController = TextEditingController();
  final _usedController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.leaveBalance.isNotEmpty) {
      _selectedLeaveType = widget.leaveBalance[0]['leave_type']?.toString() ?? 
                          widget.leaveBalance[0]['leaveType']?.toString();
      _loadCurrentValues();
    }
  }

  void _loadCurrentValues() {
    if (_selectedLeaveType == null) return;
    
    final balance = widget.leaveBalance.firstWhere(
      (b) => (b['leave_type']?.toString() ?? b['leaveType']?.toString()) == _selectedLeaveType,
      orElse: () => {},
    );

    if (balance.isNotEmpty) {
      _balanceController.text = balance['balance']?.toString() ?? '';
      _accruedController.text = balance['accrued']?.toString() ?? '';
      _usedController.text = balance['used']?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _balanceController.dispose();
    _accruedController.dispose();
    _usedController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Update Leave Balance'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: _selectedLeaveType,
                decoration: const InputDecoration(
                  labelText: 'Leave Type *',
                  border: OutlineInputBorder(),
                ),
                items: widget.leaveBalance.map((b) {
                  final leaveType = b['leave_type']?.toString() ?? b['leaveType']?.toString() ?? '';
                  return DropdownMenuItem(
                    value: leaveType,
                    child: Text(leaveType.toUpperCase()),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedLeaveType = value;
                    _balanceController.clear();
                    _accruedController.clear();
                    _usedController.clear();
                  });
                  _loadCurrentValues();
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _balanceController,
                decoration: const InputDecoration(
                  labelText: 'Balance',
                  border: OutlineInputBorder(),
                  helperText: 'Leave empty to keep current value',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _accruedController,
                decoration: const InputDecoration(
                  labelText: 'Accrued',
                  border: OutlineInputBorder(),
                  helperText: 'Leave empty to keep current value',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _usedController,
                decoration: const InputDecoration(
                  labelText: 'Used',
                  border: OutlineInputBorder(),
                  helperText: 'Leave empty to keep current value',
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate() && _selectedLeaveType != null) {
              Navigator.pop(context, {
                'leaveType': _selectedLeaveType,
                'balance': _balanceController.text.isNotEmpty 
                    ? double.tryParse(_balanceController.text) 
                    : null,
                'accrued': _accruedController.text.isNotEmpty 
                    ? double.tryParse(_accruedController.text) 
                    : null,
                'used': _usedController.text.isNotEmpty 
                    ? double.tryParse(_usedController.text) 
                    : null,
              });
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
          ),
          child: const Text('Update'),
        ),
      ],
    );
  }
}

