import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class ProductivityDashboardScreen extends StatefulWidget {
  const ProductivityDashboardScreen({super.key});

  @override
  State<ProductivityDashboardScreen> createState() => _ProductivityDashboardScreenState();
}

class _ProductivityDashboardScreenState extends State<ProductivityDashboardScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _metrics = [];
  List<dynamic> _employees = [];
  String? _selectedEmployeeId;
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadEmployees();
    _loadMetrics();
  }

  Future<void> _loadEmployees() async {
    try {
      final employees = await _apiService.getEmployees();
      setState(() => _employees = employees);
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> _loadMetrics() async {
    setState(() => _isLoading = true);
    try {
      // Only include employeeId if a specific employee is selected (not "All Employees")
      final metrics = await _apiService.getProductivityMetrics(
        employeeId: _selectedEmployeeId != null && _selectedEmployeeId!.isNotEmpty
            ? _selectedEmployeeId
            : null,
        startDate: DateFormat('yyyy-MM-dd').format(_startDate),
        endDate: DateFormat('yyyy-MM-dd').format(_endDate),
      );
      setState(() => _metrics = metrics);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading metrics: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  double get _averageProductivity {
    if (_metrics.isEmpty) return 0;
    final total = _metrics.fold<double>(
      0,
      (sum, m) => sum + (double.tryParse(m['productivity_score']?.toString() ?? '0') ?? 0),
    );
    return total / _metrics.length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Productivity Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMetrics,
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
                      _loadMetrics();
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
                              setState(() {
                                _startDate = picked;
                                _loadMetrics();
                              });
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
                              setState(() {
                                _endDate = picked;
                                _loadMetrics();
                              });
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // Average Productivity Card
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Text(
                    'Average Productivity',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${_averageProductivity.toStringAsFixed(1)}%',
                    style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: _averageProductivity / 100,
                    minHeight: 12,
                    backgroundColor: Colors.grey[300],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _averageProductivity >= 80
                          ? Colors.green
                          : _averageProductivity >= 60
                              ? Colors.orange
                              : Colors.red,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Metrics List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _metrics.isEmpty
                    ? const Center(child: Text('No productivity metrics found'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _metrics.length,
                        itemBuilder: (context, index) {
                          final metric = _metrics[index];
                          final score = double.tryParse(metric['productivity_score']?.toString() ?? '0') ?? 0;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              title: Text(metric['employeeName']?.toString() ?? 'Unknown'),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Date: ${metric['metric_date'] ?? 'N/A'}'),
                                  Text('Total Hours: ${metric['total_hours'] ?? 0}'),
                                  Text('Productive Hours: ${metric['productive_hours'] ?? 0}'),
                                  Text('Idle Time: ${metric['idle_time_minutes'] ?? 0} min'),
                                  Text('Task Completion: ${metric['task_completion_rate'] ?? 0}%'),
                                ],
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    '${score.toStringAsFixed(1)}%',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: score >= 80
                                          ? Colors.green
                                          : score >= 60
                                              ? Colors.orange
                                              : Colors.red,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  SizedBox(
                                    width: 60,
                                    child: LinearProgressIndicator(
                                      value: score / 100,
                                      minHeight: 6,
                                      backgroundColor: Colors.grey[300],
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        score >= 80
                                            ? Colors.green
                                            : score >= 60
                                                ? Colors.orange
                                                : Colors.red,
                                      ),
                                    ),
                                  ),
                                ],
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

