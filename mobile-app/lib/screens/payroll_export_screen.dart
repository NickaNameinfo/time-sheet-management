import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';
import 'dart:convert';

class PayrollExportScreen extends StatefulWidget {
  const PayrollExportScreen({super.key});

  @override
  State<PayrollExportScreen> createState() => _PayrollExportScreenState();
}

class _PayrollExportScreenState extends State<PayrollExportScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _employees = [];
  String? _selectedEmployeeId;
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();
  String _selectedFormat = 'json';
  Map<String, dynamic>? _payrollData;
  Map<String, dynamic>? _appSettings;

  @override
  void initState() {
    super.initState();
    _loadEmployees();
    _loadAppSettings();
  }

  Future<void> _loadAppSettings() async {
    try {
      final settings = await _apiService.getAppSettings();
      setState(() => _appSettings = settings);
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> _loadEmployees() async {
    try {
      final employees = await _apiService.getEmployees();
      setState(() => _employees = employees);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading employees: $e')),
        );
      }
    }
  }

  Future<void> _generatePayroll() async {
    setState(() => _isLoading = true);
    try {
      final payroll = await _apiService.generatePayrollSummary(
        employeeId: _selectedEmployeeId != null && _selectedEmployeeId!.isNotEmpty
            ? _selectedEmployeeId
            : null,
        startDate: DateFormat('yyyy-MM-dd').format(_startDate),
        endDate: DateFormat('yyyy-MM-dd').format(_endDate),
        format: _selectedFormat,
      );
      setState(() => _payrollData = payroll);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error generating payroll: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String get _selectedEmployeeName {
    if (_selectedEmployeeId == null || _selectedEmployeeId!.isEmpty) {
      return 'All Employees';
    }
    final employee = _employees.firstWhere(
      (e) => e['id']?.toString() == _selectedEmployeeId,
      orElse: () => {},
    );
    return employee['employeeName']?.toString() ?? 'Unknown';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payroll Export'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _generatePayroll,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filters
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  DropdownButtonFormField<String>(
                    value: _selectedEmployeeId,
                    decoration: const InputDecoration(
                      labelText: 'Employee',
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All Employees')),
                      ..._employees.map((emp) {
                        return DropdownMenuItem(
                          value: emp['id']?.toString(),
                          child: Text('${emp['employeeName']} (${emp['EMPID'] ?? ''})'),
                        );
                      }),
                    ],
                    onChanged: (value) {
                      setState(() => _selectedEmployeeId = value);
                    },
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ListTile(
                          title: const Text('Start Date'),
                          subtitle: Text(DateFormat('yyyy-MM-dd').format(_startDate)),
                          trailing: const Icon(Icons.calendar_today),
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _startDate,
                              firstDate: DateTime(2000),
                              lastDate: DateTime(2100),
                            );
                            if (picked != null) {
                              setState(() => _startDate = picked);
                            }
                          },
                        ),
                      ),
                      Expanded(
                        child: ListTile(
                          title: const Text('End Date'),
                          subtitle: Text(DateFormat('yyyy-MM-dd').format(_endDate)),
                          trailing: const Icon(Icons.calendar_today),
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _endDate,
                              firstDate: DateTime(2000),
                              lastDate: DateTime(2100),
                            );
                            if (picked != null) {
                              setState(() => _endDate = picked);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedFormat,
                    decoration: const InputDecoration(
                      labelText: 'Format',
                      border: OutlineInputBorder(),
                    ),
                    items: ['json', 'excel', 'pdf', 'tally', 'quickbooks']
                        .map((f) => DropdownMenuItem(value: f, child: Text(f.toUpperCase())))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) setState(() => _selectedFormat = value);
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _generatePayroll,
                      icon: const Icon(Icons.calculate),
                      label: const Text('Generate Payroll'),
                    ),
                  ),
                  if (_selectedEmployeeId != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        'Selected: $_selectedEmployeeName',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          // Payroll Data Display
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _payrollData == null
                    ? const Center(child: Text('Generate payroll to view data'))
                    : _selectedFormat == 'json'
                        ? _buildJsonView()
                        : Center(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.check_circle, size: 64, color: Colors.green),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'Payroll Generated Successfully',
                                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Format: ${_selectedFormat.toUpperCase()}'),
                                  Text('Employee: $_selectedEmployeeName'),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () {
                                      // Note: File download would be handled by backend
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('File download would be initiated here'),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.download),
                                    label: const Text('Download File'),
                                  ),
                                ],
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildJsonView() {
    final data = _payrollData;
    if (data == null) return const Center(child: Text('No data'));

    // Convert to list if it's a single object
    List<dynamic> payrollList = [];
    if (data is List) {
      payrollList = data;
    } else if (data['employees'] != null) {
      payrollList = data['employees'] as List<dynamic>? ?? [];
    } else {
      payrollList = [data];
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Payroll Data - $_selectedEmployeeName',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: payrollList.length,
            itemBuilder: (context, index) {
              final item = payrollList[index];
              final currency = _appSettings?['currency'] ?? 'AED';
              final currencySymbol = _appSettings?['currency_symbol'] ?? '';

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ExpansionTile(
                  title: Text(item['employeeName']?.toString() ?? 'Unknown'),
                  subtitle: Text('Total: $currencySymbol${item['totalAmount'] ?? item['total'] ?? 0} $currency'),
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildDataRow('Employee ID', item['employeeId']?.toString() ?? 'N/A'),
                          _buildDataRow('Total Hours', '${item['totalHours'] ?? 0}'),
                          _buildDataRow('Regular Hours', '${item['regularHours'] ?? 0}'),
                          _buildDataRow('Overtime Hours', '${item['overtimeHours'] ?? 0}'),
                          _buildDataRow('Regular Pay', '$currencySymbol${item['regularPay'] ?? 0} $currency'),
                          _buildDataRow('Overtime Pay', '$currencySymbol${item['overtimePay'] ?? 0} $currency'),
                          _buildDataRow('Total Amount', '$currencySymbol${item['totalAmount'] ?? item['total'] ?? 0} $currency'),
                          if (item['deductions'] != null)
                            _buildDataRow('Deductions', '$currencySymbol${item['deductions']} $currency'),
                          if (item['netPay'] != null)
                            _buildDataRow('Net Pay', '$currencySymbol${item['netPay']} $currency'),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

